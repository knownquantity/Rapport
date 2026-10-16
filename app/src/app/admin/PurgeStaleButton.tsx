'use client';

export default function PurgeStaleButton({
  action,
  token,
}: {
  action: (formData: FormData) => void | Promise<void>;
  token: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (
          !window.confirm(
            'Mark pending claims older than 24 hours as removed?',
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="token" value={token} />
      <button
        type="submit"
        className="rounded-full border border-[#1a1a1a]/20 px-3 py-1 text-xs font-medium text-[#1a1a1a]/70 transition-colors hover:bg-[#1a1a1a]/5"
      >
        Purge stale pending
      </button>
    </form>
  );
}
