import { Suspense } from "react";
import { SsoConsumer } from "./SsoConsumer";

// useSearchParams() must be inside a Suspense boundary during prerender.
export default function SsoPage() {
  return (
    <Suspense fallback={null}>
      <SsoConsumer />
    </Suspense>
  );
}
