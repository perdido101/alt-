/** Android App Links: lets https://<site>/j/<token> open the app directly. */
export function GET() {
  const pkg = process.env.APP_BUNDLE_ID ?? 'gr.alt.app';
  const fingerprints = (process.env.ANDROID_CERT_SHA256 ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  return Response.json([
    { relation: ['delegate_permission/common.handle_all_urls'], target: { namespace: 'android_app', package_name: pkg, sha256_cert_fingerprints: fingerprints } },
  ]);
}
