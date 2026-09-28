import { Connection, PublicKey } from "@solana/web3.js";
import {
  CHAINLINK_SOL_USD_FEED,
  CHAINLINK_STORE_PROGRAM,
} from "@/lib/constants";

/** Anchor account discriminator (8) + Transmissions header (HEADER_SIZE = 192) */
const TRANSMISSIONS_HEADER_BYTES = 8 + 192;
/** sizeof(Transmission) in chainlink-solana store state */
const TRANSMISSION_SIZE = 48;
/** answer field offset within Transmission: slot(8)+timestamp(4)+pad(4) */
const ANSWER_OFFSET = 16;

function readI128LE(data: Buffer, offset: number): bigint {
  let x = BigInt(0);
  for (let i = 0; i < 16; i++) {
    x |= BigInt(data[offset + i]!) << BigInt(8 * i);
  }
  if (x >= BigInt(1) << BigInt(127)) x -= BigInt(1) << BigInt(128);
  return x;
}

export interface SolUsdQuote {
  priceUsd: number;
  decimals: number;
  feed: string;
  source: "chainlink";
}

/**
 * Đọc giá SOL/USD từ Chainlink Data Feed trên Solana Devnet (off-chain account parse).
 * Layout: Transmissions header + live ringbuffer — xem chainlink-solana store state.rs
 * Feed: https://docs.chain.link/data-feeds/solana/using-data-feeds-off-chain
 */
export async function fetchChainlinkSolUsd(
  connection: Connection,
  feed: PublicKey = CHAINLINK_SOL_USD_FEED
): Promise<SolUsdQuote> {
  const info = await connection.getAccountInfo(feed, "confirmed");
  if (!info) {
    throw new Error("paymentErrors.chainlinkUnavailable");
  }
  if (!info.owner.equals(CHAINLINK_STORE_PROGRAM)) {
    throw new Error("paymentErrors.chainlinkOwner");
  }

  const data = Buffer.from(info.data);
  if (data.length < TRANSMISSIONS_HEADER_BYTES + TRANSMISSION_SIZE) {
    throw new Error("paymentErrors.chainlinkLayout");
  }

  // Anchor Transmissions: after disc(8)+version+state+3*pubkey(96)+description(32) → decimals
  // Empirically decimals sits at index of first u8=8 right after "SOL / USD" padding (offset 138 on current Devnet feed)
  const descIdx = data.indexOf(Buffer.from("SOL / USD"));
  const decimalsOffset = descIdx >= 0 ? descIdx + 32 : 138;
  const decimals = data[decimalsOffset] ?? 8;
  if (decimals === 0 || decimals > 18) {
    throw new Error("paymentErrors.chainlinkDecimals");
  }

  // live_length u32 LE — sits shortly after decimals + flagging_threshold(u32) + latest_round_id(u32) + granularity(u8)
  // Current Devnet SOL/USD feed uses live_length = 1 (single slot after 200-byte header)
  let liveLength = 1;
  let liveCursor = 0;
  // Try parse live_length / live_cursor from header tail (before ringbuffer)
  // Layout after decimals (1) + flagging (4) + latest_round_id (4) + granularity (1) + live_length (4) + live_cursor (4)
  const afterDecimals = decimalsOffset + 1;
  if (afterDecimals + 17 <= TRANSMISSIONS_HEADER_BYTES) {
    // flagging_threshold(4) + latest_round_id(4) + granularity(1)
    const liveLengthOff = afterDecimals + 4 + 4 + 1;
    liveLength = Math.max(1, data.readUInt32LE(liveLengthOff));
    liveCursor = data.readUInt32LE(liveLengthOff + 4);
  }

  const ringBytes = data.length - TRANSMISSIONS_HEADER_BYTES;
  const maxSlots = Math.floor(ringBytes / TRANSMISSION_SIZE);
  if (maxSlots < 1) throw new Error("paymentErrors.chainlinkEmpty");

  liveLength = Math.min(liveLength, maxSlots);
  const idx = (liveCursor + liveLength - 1) % liveLength;
  const txOff = TRANSMISSIONS_HEADER_BYTES + idx * TRANSMISSION_SIZE;
  const answer = readI128LE(data, txOff + ANSWER_OFFSET);
  if (answer <= BigInt(0)) {
    throw new Error("paymentErrors.chainlinkInvalidPrice");
  }

  const priceUsd = Number(answer) / 10 ** decimals;
  if (!Number.isFinite(priceUsd) || priceUsd < 1 || priceUsd > 1_000_000) {
    throw new Error("paymentErrors.chainlinkPriceRange");
  }

  return {
    priceUsd,
    decimals,
    feed: feed.toBase58(),
    source: "chainlink",
  };
}

/** Quy đổi USD → lamports SOL theo giá Chainlink (làm tròn lên để đủ cover) */
export function usdToLamports(usdAmount: number, solUsdPrice: number): number {
  if (solUsdPrice <= 0) throw new Error("paymentErrors.solPriceInvalid");
  const sol = usdAmount / solUsdPrice;
  // +0.5% buffer cho trượt giá nhẹ giữa lúc quote và confirm
  const withBuffer = sol * 1.005;
  return Math.ceil(withBuffer * 1e9);
}

/** Quy đổi USD → USDC base units (6 decimals) */
export function usdToUsdcBaseUnits(usdAmount: number): number {
  return Math.round(usdAmount * 1e6);
}
