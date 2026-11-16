import ExchangeDashboard from "@/components/ExchangeDashboard";
import { fetchLatestCropPrices } from "@/lib/crops";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { crops, latestDate, isMock } = await fetchLatestCropPrices();

  return (
    <ExchangeDashboard
      initialCrops={crops}
      latestDate={latestDate}
      isMock={isMock}
    />
  );
}
