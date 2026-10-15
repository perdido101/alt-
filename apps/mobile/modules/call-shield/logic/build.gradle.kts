plugins {
    kotlin("jvm") version "2.0.21"
}

repositories { mavenCentral() }

dependencies {
    implementation("com.googlecode.libphonenumber:libphonenumber:9.0.16")
    testImplementation(kotlin("test"))
    testImplementation("org.json:json:20240303")
}

// Bytecode level matches Android; builds with whatever JDK 17+ is installed.
java { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
kotlin { compilerOptions { jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17) } }

tasks.test {
    useJUnitPlatform()
    // Shared with packages/core so TS and Kotlin classify the same numbers the same way.
    systemProperty("fixtures", rootDir.resolve("../../../../../packages/core/fixtures/classification-cases.json").canonicalPath)
}
