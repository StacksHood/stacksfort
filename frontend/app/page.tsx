export default function Home() {
  const highlights = [
    { label: "Thresholds", value: "2/3 • 4/7 • 7/10", hint: "Flexible quorum rules" },
    { label: "Assets", value: "STX + SIP-010", hint: "Native + token support" },
    { label: "Signers", value: "Up to 100", hint: "Large committees supported" },
  ];

  const transactionSteps = [
    {
      title: "Propose",
      description:
        "Submit a transaction to the contract. Everyone sees the same payload and hash.",
      badge: "submit-txn",
    },
    {
      title: "Collect signatures",
      description:
        "Signers review the hash off-chain and sign using their wallet keys until the threshold is met.",
      badge: "hash-txn",
    },
    {
      title: "Execute",
      description:
        "Once the signature set is ready, anyone can execute the STX or SIP-010 transfer on-chain.",
      badge: "execute",
    },
  ];

  const signerRows = [
    { name: "0x3ad2…1b9c", role: "Treasury lead", status: "Signed", tone: "text-emerald-300 bg-emerald-400/10" },
    { name: "0x72ff…9a0d", role: "Ops", status: "Pending", tone: "text-amber-200 bg-amber-400/10" },
    { name: "0x4c0a…cfe2", role: "Security", status: "Signed", tone: "text-emerald-300 bg-emerald-400/10" },
    { name: "0xf11b…aa27", role: "Compliance", status: "Queued", tone: "text-slate-200 bg-slate-500/15" },
  ];

  return (
    <div className="space-y-16 py-12 sm:space-y-20 sm:py-16">
      <section
        id="overview"
        className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start"
      >
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-amber-200">
            P0 • Multisig workflow
          </span>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Coordinate signers across Stacks without losing momentum.
            </h1>
            <p className="text-lg text-slate-300">
              Submit transactions, collect off-chain signatures, and execute on-chain
              once quorum is met. Stay aware of signer status and network health from
              the first interaction.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#transactions"
              className="rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 px-5 py-3 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-500/20 transition-transform duration-150 hover:translate-y-[-2px]"
            >
              Start a transaction
            </a>
            <a
              href="#docs"
              className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors duration-150 hover:border-amber-300 hover:text-amber-200"
            >
              View documentation
            </a>
            <span className="text-xs uppercase tracking-[0.14em] text-slate-400">
              STX • SIP-010 • Threshold-safe
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {highlights.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/5 bg-white/5 px-4 py-5"
              >
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {item.value}
                </p>
                <p className="text-sm text-slate-400">{item.hint}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-gradient-to-b from-white/5 to-white/0 p-6 shadow-xl shadow-black/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Latest activity</p>
              <p className="text-2xl font-semibold text-white">
                Multisig vault #47a
              </p>
            </div>
            <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
              Ready to execute
            </span>
          </div>
          <div className="mt-6 space-y-4">
            {[
              {
                title: "sBTC transfer to treasury",
                status: "2 / 3 signatures collected",
                badge: "Collecting signatures",
              },
              {
                title: "STX gas top-up",
                status: "Executed by 0x3ad2…1b9c",
                badge: "Executed",
              },
              {
                title: "Add new signer",
                status: "Awaiting first signature",
                badge: "Pending",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-white/5 bg-white/5 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white">{item.title}</p>
                  <span className="rounded-full bg-slate-700/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-200">
                    {item.badge}
                  </span>
                </div>
                <p className="text-sm text-slate-400">{item.status}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="transactions" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.14em] text-slate-400">
              Transaction flow
            </p>
            <h2 className="text-2xl font-semibold text-white">
              One workflow across proposal, signatures, and execution.
            </h2>
          </div>
          <a
            href="#overview"
            className="hidden rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors duration-150 hover:border-amber-300 hover:text-amber-200 sm:inline-flex"
          >
            Back to overview
          </a>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {transactionSteps.map((step) => (
            <div
              key={step.title}
              className="flex flex-col justify-between rounded-2xl border border-white/5 bg-white/5 px-5 py-6 shadow-inner shadow-black/20"
            >
              <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-200">
                {step.badge}
              </div>
              <h3 className="text-xl font-semibold text-white">{step.title}</h3>
              <p className="mt-3 text-sm text-slate-300">{step.description}</p>
              <div className="mt-5 h-1 w-full rounded-full bg-slate-800">
                <span className="block h-1 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="signers" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.14em] text-slate-400">
              Signer visibility
            </p>
            <h2 className="text-2xl font-semibold text-white">
              Know which signers have signed and what comes next.
            </h2>
          </div>
          <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
            Threshold 2 of 3
          </span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/5">
          <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 border-b border-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-300 sm:grid-cols-[2fr_1fr_1fr]">
            <span>Signer</span>
            <span className="text-center">Role</span>
            <span className="text-right">Status</span>
          </div>
          <div className="divide-y divide-white/5">
            {signerRows.map((signer) => (
              <div
                key={signer.name}
                className="grid grid-cols-[2fr_1fr_1fr] items-center gap-4 px-4 py-3 sm:grid-cols-[2fr_1fr_1fr]"
              >
                <div>
                  <p className="font-semibold text-white">{signer.name}</p>
                  <p className="text-sm text-slate-400">Stacks signer</p>
                </div>
                <p className="text-center text-sm text-slate-300">
                  {signer.role}
                </p>
                <div className="flex justify-end">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${signer.tone}`}
                  >
                    {signer.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="docs"
        className="grid gap-6 rounded-2xl border border-white/5 bg-gradient-to-r from-white/5 to-white/0 p-6 sm:grid-cols-[1.2fr_0.8fr]"
      >
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.14em] text-slate-400">
            Documentation
          </p>
          <h2 className="text-2xl font-semibold text-white">
            Build with Stacks Connect and follow the multisig playbook.
          </h2>
          <p className="text-slate-300">
            The Stacks docs live alongside this codebase. Read the stacks folder for
            implementation details or jump into issues to collaborate on the next
            milestone.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://docs.stacks.co"
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-white/20"
              target="_blank"
              rel="noreferrer"
            >
              Stacks docs
            </a>
            <a
              href="/issues.md"
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors duration-150 hover:border-amber-300 hover:text-amber-200"
            >
              Project issues
            </a>
            <a
              href="/stacks/INDEX.md"
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors duration-150 hover:border-amber-300 hover:text-amber-200"
            >
              Stacks knowledge base
            </a>
          </div>
        </div>
        <div className="space-y-3 rounded-xl border border-white/5 bg-white/5 p-4 shadow-inner shadow-black/30">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Next actions</p>
            <span className="rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-200">
              Checklist
            </span>
          </div>
          <ul className="space-y-2 text-sm text-slate-200">
            <li>• Connect your wallet to view signer status.</li>
            <li>• Submit a STX or SIP-010 transaction draft.</li>
            <li>• Invite signers to co-sign the transaction hash.</li>
            <li>• Execute once threshold signatures are ready.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
