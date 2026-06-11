export function uniqueFilenames(names: string[]): string[] {
  const used = new Set<string>();

  return names.map((name) => {
    if (!used.has(name)) {
      used.add(name);
      return name;
    }

    const dotIndex = name.lastIndexOf('.');
    const hasExtension = dotIndex > 0;
    const base = hasExtension ? name.slice(0, dotIndex) : name;
    const ext = hasExtension ? name.slice(dotIndex) : '';

    let counter = 2;
    let candidate = `${base}-${counter}${ext}`;
    while (used.has(candidate)) {
      counter++;
      candidate = `${base}-${counter}${ext}`;
    }

    used.add(candidate);
    return candidate;
  });
}
