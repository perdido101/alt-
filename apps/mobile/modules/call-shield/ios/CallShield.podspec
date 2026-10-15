Pod::Spec.new do |s|
  s.name           = 'CallShield'
  s.version        = '0.1.0'
  s.summary        = 'ΑΛΤ! call protection: Call Directory list for iOS'
  s.description    = 'Writes reported scam and official numbers for the ΑΛΤ! Call Directory Extension.'
  s.author         = 'ΑΛΤ!'
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = { :ios => '16.0' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks     = 'CallKit'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = '**/*.{h,m,mm,swift}'
end
