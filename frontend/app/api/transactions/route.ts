import { NextRequest, NextResponse } from "next/server";

interface Signature {
  signer: string;
  signature: string;
  timestamp: number;
}

interface StoredTransaction {
  txId: number;
  contractAddress: string;
  signatures: Signature[];
  createdAt: number;
}

const transactionStore = new Map<string, StoredTransaction>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const txId = searchParams.get("txId");
  const contractAddress = searchParams.get("contract");

  if (!txId || !contractAddress) {
    return NextResponse.json(
      { error: "Missing txId or contract parameter" },
      { status: 400 }
    );
  }

  const key = `${contractAddress}:${txId}`;
  const stored = transactionStore.get(key);

  if (!stored) {
    return NextResponse.json(
      { signatures: [], txId, contractAddress },
      { status: 200 }
    );
  }

  return NextResponse.json({
    txId: stored.txId,
    contractAddress: stored.contractAddress,
    signatures: stored.signatures,
    createdAt: stored.createdAt,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { txId, contractAddress, signer, signature } = body;

    if (!txId || !contractAddress || !signer || !signature) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const key = `${contractAddress}:${txId}`;
    const stored = transactionStore.get(key);

    const newSignature: Signature = {
      signer,
      signature,
      timestamp: Date.now(),
    };

    if (!stored) {
      transactionStore.set(key, {
        txId,
        contractAddress,
        signatures: [newSignature],
        createdAt: Date.now(),
      });
    } else {
      const existingSigner = stored.signatures.find(
        (s) => s.signer === signer
      );

      if (existingSigner) {
        return NextResponse.json(
          { error: "Signer has already signed this transaction" },
          { status: 400 }
        );
      }

      stored.signatures.push(newSignature);
    }

    const updated = transactionStore.get(key);

    return NextResponse.json({
      success: true,
      txId,
      contractAddress,
      signatures: updated?.signatures || [],
      signatureCount: updated?.signatures.length || 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const txId = searchParams.get("txId");
  const contractAddress = searchParams.get("contract");

  if (!txId || !contractAddress) {
    return NextResponse.json(
      { error: "Missing txId or contract parameter" },
      { status: 400 }
    );
  }

  const key = `${contractAddress}:${txId}`;

  if (transactionStore.has(key)) {
    transactionStore.delete(key);
    return NextResponse.json({ success: true, message: "Transaction archived" });
  }

  return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
}