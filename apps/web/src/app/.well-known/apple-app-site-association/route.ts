/** iOS Universal Links for invite links (/j/<token> in either locale). */
export function GET() {
  const appId = `${process.env.APPLE_TEAM_ID ?? 'TEAMID'}.${process.env.APP_BUNDLE_ID ?? 'gr.alt.app'}`;
  return Response.json({
    applinks: { details: [{ appIDs: [appId], components: [{ '/': '/j/*' }, { '/': '/el/j/*' }, { '/': '/en/j/*' }] }] },
  });
}
