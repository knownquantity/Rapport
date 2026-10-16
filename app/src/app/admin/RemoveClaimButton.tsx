'use client';

export default function RemoveClaimButton({
  action,
  id,
  token,
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  token: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm('Mark this claim as removed?')) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="token" value={token} />
      <button
        type="submit"
        className="rounded-full border border-[#a1330a]/30 px-3 py-1 text-xs font-medium text-[#a1330a] transition-colors hover:bg-[#a1330a]/10"
      >
        Remove
      </button>
    </form>
  );
}
