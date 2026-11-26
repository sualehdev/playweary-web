/** A string of twinkling bulbs hung under the header. Pure CSS animation. */
export default function Lights() {
  return (
    <div className="xLights" aria-hidden="true">
      {Array.from({ length: 40 }, (_, i) => (
        <i key={i} style={{ ["--d" as string]: `${((i * 5) % 9) * 0.25}s` }} />
      ))}
    </div>
  );
}
