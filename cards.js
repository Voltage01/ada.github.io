// Show the first three entries; reveal a button only when more entries exist.
for (const section of [
  { list: "projects-done-grid", button: "projects-toggle", noun: "projects" },
  { list: "events-list", button: "events-toggle", noun: "events" }
]) {
  const list = document.getElementById(section.list);
  const button = document.getElementById(section.button);
  if (!list || !button) continue;
  const actions = button.parentElement;
  const limit = Math.max(1, Number(list.dataset.previewCount) || 3);
  let expanded = false;
  const update = () => {
    const cards = Array.from(list.children).filter(card => card.matches("article"));
    const hasMore = cards.length > limit;
    if (!hasMore) expanded = false;
    cards.forEach((card, index) => { card.hidden = !expanded && index >= limit; });
    actions.hidden = !hasMore;
    button.setAttribute("aria-expanded", String(expanded));
    button.textContent = expanded ? `Show fewer ${section.noun}` : `Show more ${section.noun}`;
  };
  button.addEventListener("click", () => { expanded = !expanded; update(); });
  update();
  // Also handle entries added or removed after page load.
  new MutationObserver(update).observe(list, { childList: true });
}
