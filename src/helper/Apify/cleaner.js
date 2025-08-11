// clean-linkedin.js
// Input:  an array of raw profiles (like the one you pasted)
// Output: an array in the target, simplified format

export function cleanProfile(p) {
  return {
    fullName: p.fullName ?? null,
    currentJobDurationInYrs: p.currentJobDurationInYrs ?? null,
    topSkillsByEndorsements: p.topSkillsByEndorsements ?? null,
    about: p.about ?? null,

    experiences: cleanExperiences(p.experiences || []),
    skills: (p.skills || []).map(s => s?.title).filter(Boolean),

    educations: (p.educations || []).map(ed => ({
      title: ed?.title ?? null,
      subtitle: ed?.subtitle ?? null,
    })),

    licenseAndCertificates: (p.licenseAndCertificates || []).map(lc => ({
      title: lc?.title ?? null,
      subtitle: lc?.subtitle ?? null,
    })),

    languages: (p.languages || []).map(l => ({
      title: l?.title ?? null,
      caption: l?.caption ?? null,
    })),

    projects: (p.projects || []).map(pr => ({
      title: pr?.title ?? null,
      subtitle: pr?.subtitle ?? null,
    })),

    publications: (p.publications || []).map(pub => ({
      title: pub?.title ?? null,
      subtitle: pub?.subtitle ?? null,
    })),

    patents: (p.patents || []).map(pt => ({
      title: pt?.title ?? null,
      subtitle: pt?.subtitle ?? null,
    })),

    courses: (p.courses || []).map(c => ({
      title: c?.title ?? null,
      subtitle: c?.subtitle ?? null,
    })),

    recommendations: p.recommendations || [],
  };
}

function cleanExperiences(experiences) {
  return (experiences || []).map(exp => {
    const out = {
      title: exp?.title ?? null,
      subtitle: exp?.subtitle ?? null,
    };

    const subComps = Array.isArray(exp?.subComponents) ? exp.subComponents : [];

    // Decide whether to include subComponents:
    // - include if the experience is "broken down" (roles/positions), or
    // - if any subcomponent contains a title or any non-empty description.
    const includeSubs =
      !!exp?.breakdown ||
      subComps.some(sc => (sc?.title && sc.title.trim()) || hasAnyDescription(sc));

    if (includeSubs) {
      out.subComponents = subComps.map(cleanSubComponent);
    }

    return out;
  });
}

function cleanSubComponent(sc = {}) {
  // Normalize descriptions: convert any text/media item to { text: '...' }
  const desc = Array.isArray(sc.description) ? sc.description : [];
  const normalizedDesc = desc
    .map(d => {
      const text = pickText(d);
      return text ? { text } : null;
    })
    .filter(Boolean);

  return {
    title: sc.title ?? undefined,
    subtitle: sc.subtitle ?? undefined,
    // If there were no description entries at all, keep an empty array (as in your example)
    description: normalizedDesc.length ? normalizedDesc : [],
  };
}

function hasAnyDescription(sc = {}) {
  const desc = Array.isArray(sc.description) ? sc.description : [];
  return desc.some(d => !!pickText(d));
}

function pickText(d = {}) {
  // The raw data uses "type": "textComponent" or "mediaComponent" with a "text" field.
  // If a plain string sneaks in, handle that too.
  if (typeof d === 'string') return d;
  if (typeof d?.text === 'string' && d.text.trim()) return d.text.trim();
  return null;
}