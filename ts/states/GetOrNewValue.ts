const cache: { [key: string]: { [subKey: string]: any } } = {};

export default function getOrNewValue<T>(key: string, subKey: string, getValue: () => T): T {
    const values = cache[key] = cache[key] || {};
    const value = values[subKey] = values[subKey] || getValue();

    return value;
}