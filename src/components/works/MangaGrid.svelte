<!-- src/components/works/MangaGrid.svelte
     Dynamic manga-style panel layout for projects.
     Big projects get large panels, small get small.
     Panels are trapezoids/irregular shapes via clip-path. -->
<script lang="ts">
  interface Project {
    title: string;
    description: string;
    tags: string[];
    size: 'large' | 'medium' | 'small';
    href?: string;
  }

  interface Props {
    projects: Project[];
  }

  let { projects }: Props = $props();

  // Panel layout: each panel gets a grid area + clip-path
  interface PanelLayout {
    project: Project;
    gridArea: string;       // CSS grid-area
    clipPath: string;       // CSS clip-path polygon
  }

  // Generate deterministic but dynamic panel layouts
  function generatePanelLayouts(items: Project[]): PanelLayout[] {
    const layouts: PanelLayout[] = [];
    let row = 1;

    // Sort: large first, then medium, then small
    const sorted = [...items].sort((a, b) => {
      const order = { large: 0, medium: 1, small: 2 };
      return order[a.size] - order[b.size];
    });

    let i = 0;
    while (i < sorted.length) {
      const item = sorted[i];

      if (item.size === 'large') {
        // Large panel: spans 2 cols, 2 rows
        const skewTL = 2 + (i * 7 % 5);  // 2-6% skew
        const skewBR = 3 + (i * 11 % 4); // 3-6% skew
        layouts.push({
          project: item,
          gridArea: `${row} / 1 / ${row + 2} / 3`,
          clipPath: `polygon(${skewTL}% 0%, 100% 0%, ${100 - skewBR}% 100%, 0% 100%)`,
        });
        row += 2;
        i++;
      } else if (item.size === 'medium') {
        // Medium: 1 col wide, 2 rows tall OR 2 cols wide, 1 row tall
        const variant = i % 2;
        if (variant === 0) {
          // Tall medium on left
          const skew = 3 + (i * 13 % 5);
          layouts.push({
            project: item,
            gridArea: `${row} / 1 / ${row + 2} / 2`,
            clipPath: `polygon(0% 0%, 100% ${skew}%, ${100 - skew}% 100%, 0% 100%)`,
          });
          // If next item is small, pack it beside
          if (i + 1 < sorted.length && sorted[i + 1].size !== 'large') {
            const skew2 = 2 + ((i + 1) * 9 % 6);
            layouts.push({
              project: sorted[i + 1],
              gridArea: `${row} / 2 / ${row + 2} / 3`,
              clipPath: `polygon(${skew2}% 0%, 100% 0%, 100% 100%, 0% ${100 - skew2}%)`,
            });
            i++;
          }
          row += 2;
        } else {
          // Wide medium
          const skew = 4 + (i * 7 % 4);
          layouts.push({
            project: item,
            gridArea: `${row} / 1 / ${row + 1} / 3`,
            clipPath: `polygon(0% 0%, ${100 - skew}% 0%, 100% 100%, ${skew}% 100%)`,
          });
          row += 1;
        }
        i++;
      } else {
        // Small panels: pack 2 per row
        const skew1 = 3 + (i * 11 % 5);
        layouts.push({
          project: item,
          gridArea: `${row} / 1 / ${row + 1} / 2`,
          clipPath: `polygon(0% 0%, 100% ${skew1}%, ${100 - skew1}% 100%, 0% 100%)`,
        });

        if (i + 1 < sorted.length && sorted[i + 1].size === 'small') {
          const skew2 = 2 + ((i + 1) * 7 % 6);
          layouts.push({
            project: sorted[i + 1],
            gridArea: `${row} / 2 / ${row + 1} / 3`,
            clipPath: `polygon(${skew2}% 0%, 100% 0%, 100% 100%, 0% ${100 - skew2}%)`,
          });
          i++;
        }
        row += 1;
        i++;
      }
    }

    return layouts;
  }

  const panels = $derived(generatePanelLayouts(projects));
</script>

<div class="manga-grid">
  {#each panels as panel, idx}
    <a
      class="panel"
      class:large={panel.project.size === 'large'}
      class:medium={panel.project.size === 'medium'}
      class:small={panel.project.size === 'small'}
      style="grid-area: {panel.gridArea}; clip-path: {panel.clipPath};"
      href={panel.project.href ?? '#'}
      data-panel={idx}
    >
      <div class="panel-content">
        <h3 class="panel-title">{panel.project.title}</h3>
        <p class="panel-desc">{panel.project.description}</p>
        <div class="panel-tags">
          {#each panel.project.tags as tag}
            <span class="tag">{tag}</span>
          {/each}
        </div>
      </div>
      <div class="panel-number">{String(idx + 1).padStart(2, '0')}</div>
    </a>
  {/each}
</div>

<style>
  .manga-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    max-width: 900px;
    margin: 0 auto;
    padding: 6rem 1.5rem 4rem;
  }

  .panel {
    position: relative;
    border: 2px solid var(--color-primary);
    background: color-mix(in srgb, var(--color-surface) 85%, var(--color-primary) 15%);
    text-decoration: none;
    color: var(--color-on-surface);
    overflow: hidden;
    transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1),
                box-shadow 0.3s ease;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }

  .panel:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 24px color-mix(in srgb, var(--color-primary) 25%, transparent);
    z-index: 2;
  }

  .panel.large { min-height: 340px; }
  .panel.medium { min-height: 240px; }
  .panel.small { min-height: 160px; }

  .panel-content {
    padding: 1.25rem;
    position: relative;
    z-index: 1;
  }

  .panel-title {
    font-family: 'Host Grotesk', sans-serif;
    font-size: clamp(1rem, 2vw, 1.5rem);
    font-weight: 700;
    letter-spacing: -0.02em;
    margin-bottom: 0.35rem;
  }

  .large .panel-title { font-size: clamp(1.25rem, 3vw, 2rem); }

  .panel-desc {
    font-size: 0.8rem;
    opacity: 0.7;
    line-height: 1.4;
    max-width: 36ch;
  }

  .panel-tags {
    display: flex;
    gap: 0.4rem;
    margin-top: 0.6rem;
    flex-wrap: wrap;
  }

  .tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    padding: 0.15rem 0.5rem;
    border: 1px solid color-mix(in srgb, var(--color-primary) 40%, transparent);
    border-radius: 2px;
    opacity: 0.8;
    letter-spacing: 0.02em;
  }

  .panel-number {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    opacity: 0.3;
    font-weight: 700;
  }

  @media (max-width: 640px) {
    .manga-grid {
      grid-template-columns: 1fr;
      padding: 5rem 1rem 3rem;
    }
    /* On mobile, all panels span single column */
    .panel { grid-area: auto !important; }
    .panel.large { min-height: 260px; }
    .panel.medium { min-height: 180px; }
    .panel.small { min-height: 130px; }
  }
</style>
