# Frontend - Stacks Multisig Vaults

A Next.js frontend application for the Stacks Multisig Vaults system, enabling secure multi-party control over STX and SIP-010 tokens (like sBTC).

## Dependencies

### Stacks Packages

- **`@stacks/connect`** (v7.2.0) - Wallet connection and authentication
  - Used for connecting user wallets (Leather, Xverse)
  - Handles user authentication and session management
  - Provides wallet connection UI components

- **`@stacks/transactions`** (v7.2.0) - Transaction building and signing
  - Used for building contract call transactions
  - Provides `signMessageHashRsv` for off-chain transaction signing
  - Helper functions for creating Clarity values (`Cl`)
  - Transaction serialization and signing utilities

### Core Packages

- **Next.js** (v16.0.8) - React framework with App Router
- **React** (v19.2.1) - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

## Overview

Stacks Multisig Vaults is a DeFi primitive that allows organizations, DAOs, and teams to securely manage funds using multi-signature wallets. The system supports flexible threshold schemes (e.g., 2/3, 4/5) and works with both native STX tokens and SIP-010 fungible tokens.

## Features

- 🔐 **Multi-signature Security**: Up to 100 signers with configurable thresholds
- 💰 **Multi-token Support**: Native STX and SIP-010 tokens (sBTC, etc.)
- 📝 **Transaction Proposals**: Any signer can propose transactions
- ✍️ **Off-chain Signing**: Signatures collected off-chain for efficiency
- ✅ **On-chain Verification**: All signatures verified on-chain before execution
- 📊 **Transaction History**: Complete audit trail of all transactions

## Project Structure

```
stacks-multisig-vaults/
├── smart-contract/      # Clarity smart contracts
│   ├── contracts/       # Contract source files
│   ├── tests/           # Test files
│   └── README.md        # Smart contract documentation
├── frontend/            # Next.js frontend application (to be created)
│   ├── app/             # Next.js pages
│   ├── components/      # React components
│   ├── hooks/           # Custom hooks
│   └── README.md        # Frontend documentation
├── setup-frontend.sh    # Script to initialize frontend
├── set.md               # Detailed setup guide
├── issues.md            # Project issues and tasks
└── README.md            # This file
```

## Quick Start

### 1. Set Up Smart Contract

```bash
cd smart-contract
clarinet new .
# Follow the setup guide in set.md
```

### 2. Set Up Frontend

**Option A: Use the setup script**
```bash
./setup-frontend.sh
```

**Option B: Manual setup**
```bash
npx create-next-app@latest frontend --typescript --eslint --tailwind --app --no-src-dir --import-alias "@/*" --yes
cd frontend
npm install --save @stacks/connect @stacks/transactions lucide-react
```

### 3. Read the Setup Guide

See `set.md` for detailed setup instructions for both smart contract and frontend.

## Prerequisites

- Node.js (v18+)
- Clarinet
- A Stacks wallet (Leather or Xverse)
- Git

## Contributing

We welcome contributions! Please:

1. Check `issues.md` for available tasks
2. Fork the repository
3. Create a feature branch
4. Make your changes
5. Write tests
6. Submit a pull request

## Documentation

- **Setup Guide**: `set.md` - Complete setup instructions
- **Smart Contract**: `smart-contract/README.md` - Contract documentation
- **Frontend**: `frontend/README.md` - Frontend documentation (after setup)
- **Issues**: `issues.md` - All project tasks and features

## Resources

- [Stacks Documentation](https://docs.stacks.co)
- [Clarity Language](https://docs.stacks.co/docs/clarity)
- [Stacks.js](https://stacks.js.org)
- [LearnWeb3 Discord](https://discord.gg/learnweb3)

## License

[Add your license here]

## Status

🚧 **In Development** - This project is actively being built. See `issues.md` for current tasks.
