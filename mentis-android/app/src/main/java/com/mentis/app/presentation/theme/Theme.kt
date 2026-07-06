package com.mentis.app.presentation.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val MentisDarkColorScheme = darkColorScheme(
    primary        = MentisPurple,
    onPrimary      = MentisOnPrimary,
    primaryContainer = MentisPurpleDark,
    secondary      = MentisPurpleLight,
    background     = MentisBackground,
    surface        = MentisSurface,
    onSurface      = MentisOnSurface,
    onBackground   = MentisOnSurface
)

@Composable
fun MentisTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = MentisDarkColorScheme,
        typography  = MentisTypography,
        content     = content
    )
}
