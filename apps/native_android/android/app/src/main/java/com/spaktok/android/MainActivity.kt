package com.spaktok.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.LiveTv
import androidx.compose.material.icons.filled.MailOutline
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.width
import com.spaktok.android.features.camera.ui.CameraScreen
import com.spaktok.android.features.inbox.ui.InboxScreen
import com.spaktok.android.features.live.ui.LiveScreen
import com.spaktok.android.features.discover.ui.DiscoverScreen
import com.spaktok.android.features.profile.ui.ProfileScreen
import com.spaktok.android.features.reels.ui.ReelsHomeScreen
import com.spaktok.android.ui.theme.SpaktokTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            SpaktokTheme {
                SpaktokApp()
            }
        }
    }
}

private enum class MainTab(val label: String) {
    Home("Home"),
    Discover("Discover"),
    Live("Live"),
    Camera("Camera"),
    Inbox("Inbox"),
    Profile("Profile")
}

@Composable
private fun SpaktokApp() {
    var currentTab by rememberSaveable { mutableStateOf(MainTab.Home) }

    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        // Content layer: full-screen, no padding
        when (currentTab) {
            MainTab.Home -> ReelsHomeScreen()
            MainTab.Discover -> DiscoverScreen()
            MainTab.Live -> LiveScreen()
            MainTab.Camera -> CameraScreen()
            MainTab.Inbox -> InboxScreen()
            MainTab.Profile -> ProfileScreen()
        }

        // Floating controls overlay (TikTok/Snap-style) – transparent, minimal footprint
        Row(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 20.dp)
                .background(Color.Transparent),
        ) {
            IconButton(onClick = { currentTab = MainTab.Home }) {
                Icon(imageVector = Icons.Filled.Home, contentDescription = "Home", tint = if (currentTab == MainTab.Home) Color.White else Color.LightGray)
            }
            Spacer(Modifier.width(12.dp))
            IconButton(onClick = { currentTab = MainTab.Discover }) {
                Icon(imageVector = Icons.Filled.Search, contentDescription = "Discover", tint = if (currentTab == MainTab.Discover) Color.White else Color.LightGray)
            }
            Spacer(Modifier.width(12.dp))
            // Emphasized center camera button
            IconButton(onClick = { currentTab = MainTab.Camera }) {
                Icon(imageVector = Icons.Filled.CameraAlt, contentDescription = "Camera", tint = Color.White)
            }
            Spacer(Modifier.width(12.dp))
            IconButton(onClick = { currentTab = MainTab.Live }) {
                Icon(imageVector = Icons.Filled.LiveTv, contentDescription = "Live", tint = if (currentTab == MainTab.Live) Color.White else Color.LightGray)
            }
            Spacer(Modifier.width(12.dp))
            IconButton(onClick = { currentTab = MainTab.Inbox }) {
                Icon(imageVector = Icons.Filled.MailOutline, contentDescription = "Inbox", tint = if (currentTab == MainTab.Inbox) Color.White else Color.LightGray)
            }
            Spacer(Modifier.width(12.dp))
            IconButton(onClick = { currentTab = MainTab.Profile }) {
                Icon(imageVector = Icons.Filled.Person, contentDescription = "Profile", tint = if (currentTab == MainTab.Profile) Color.White else Color.LightGray)
            }
        }
    }
}

@Composable
private fun SpaktokAppPreview() {
    SpaktokTheme {
        SpaktokApp()
    }
}
