export function DefaultNotFound() {
  return (
    <div className="flex flex-col flex-1 gap-4 items-center justify-center max-w-8xl w-full mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold relative">
        <span className="absolute text-[30vw] font-bold left-[50%] translate-x-[-50%] top-[50%] translate-y-[-50%] select-none pointer-events-none text-muted">
          404
        </span>
        <span className="relative z-10 text-balance text-[clamp(1.5rem,5vw,8rem)]">NOT FOUND</span>
      </h1>
    </div>
  );
}
