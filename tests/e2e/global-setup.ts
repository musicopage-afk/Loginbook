async function waitForApp(baseUrl: string) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/login`, {
        redirect: "manual"
      });

      if (response.ok || response.status === 307 || response.status === 308) {
        return;
      }
    } catch {
      // The app container may still be starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }

  throw new Error(`Timed out waiting for ${baseUrl}`);
}

export default async function globalSetup() {
  await waitForApp(process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000");
}
