export function toDamlDecimal(value: number | string): string {
  return typeof value === 'number' ? value.toString() : value;
}

export function getNestedValue(
  object: Record<string, unknown> | undefined,
  path: string,
): unknown {
  if (!object) {
    return undefined;
  }

  return path.split('.').reduce<unknown>((current, key) => {
    if (
      current &&
      typeof current === 'object' &&
      key in (current as Record<string, unknown>)
    ) {
      return (current as Record<string, unknown>)[key];
    }

    return undefined;
  }, object);
}

export function findByPath<
  T extends { createArguments?: Record<string, unknown> },
>(contracts: T[], path: string, expectedValue: string): T | undefined {
  return contracts.find(
    (contract) =>
      getNestedValue(contract.createArguments, path) === expectedValue,
  );
}

export function filterByPath<
  T extends { createArguments?: Record<string, unknown> },
>(contracts: T[], path: string, expectedValue: string): T[] {
  return contracts.filter(
    (contract) =>
      getNestedValue(contract.createArguments, path) === expectedValue,
  );
}
