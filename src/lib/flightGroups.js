export function isGroupCollapsed(collapsedGroups, groupKey) {
  return collapsedGroups[groupKey] ?? true;
}

export function collectGroupKeys(results) {
  return Object.keys(results)
    .filter((date) => Array.isArray(results[date]) && results[date].length > 0)
    .sort()
    .flatMap((date) => {
      const carrierCodes = new Set(results[date].map((flight) => flight.carrier_code));
      return [...carrierCodes].map((carrierCode) => `${date}-${carrierCode}`);
    });
}
