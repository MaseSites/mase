import { slugify } from '../models/products.js';

export function normalizeOptionGroups(rawGroups) {
  if (!Array.isArray(rawGroups)) return [];
  return rawGroups
    .map((group) => {
      const key = String(group?.key || group?.name || '').trim();
      const label = String(group?.label || group?.name || '').trim();
      const values = String(Array.isArray(group?.values) ? group.values.join('\n') : group?.values || '')
        .split(/[\n,]/)
        .map((value) => value.trim())
        .filter(Boolean);
      const uniqueValues = [...new Set(values)];
      return label && uniqueValues.length ? { key: key || slugify(label), label, values: uniqueValues } : null;
    })
    .filter(Boolean);
}

export function parseOptionGroups(input) {
  try {
    const parsed = typeof input === 'string' ? JSON.parse(input) : input;
    return normalizeOptionGroups(parsed);
  } catch {
    return [];
  }
}

export function buildCombinations(optionGroups) {
  const groups = normalizeOptionGroups(optionGroups);
  if (!groups.length) return [];

  const combinations = [{ values: [] }];
  for (const group of groups) {
    const next = [];
    for (const combination of combinations) {
      for (const value of group.values) {
        next.push({
          values: combination.values.concat({ group: group.label, key: group.key, value }),
        });
      }
    }
    combinations.splice(0, combinations.length, ...next);
  }

  return combinations.map((combo, index) => {
    const signature = combo.values
      .map((entry) => `${slugify(entry.key || entry.group)}:${slugify(entry.value)}`)
      .join('__') || `variant-${index + 1}`;
    const label = combo.values.map((entry) => entry.value).join(' - ');
    return {
      index,
      signature,
      label,
      values: combo.values,
      titleSuffix: label,
    };
  });
}

export function buildVariantTitle(productName, combo) {
  const suffix = combo?.titleSuffix || combo?.values?.map((entry) => entry.value).join(' - ');
  return suffix ? `${productName} - ${suffix}` : productName;
}

export function comboFromSelection(optionGroups, selectedValues) {
  const groups = normalizeOptionGroups(optionGroups);
  const values = groups.map((group) => ({
    group: group.label,
    key: group.key,
    value: selectedValues?.[group.key] || '',
  }));
  if (values.some((entry) => !entry.value)) return null;
  const signature = values.map((entry) => `${slugify(entry.key || entry.group)}:${slugify(entry.value)}`).join('__');
  return { signature, values, label: values.map((entry) => entry.value).join(' - ') };
}
