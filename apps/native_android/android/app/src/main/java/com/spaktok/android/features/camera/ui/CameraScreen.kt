package com.spaktok.android.features.camera.ui

import android.app.Application
import androidx.camera.core.Preview
import androidx.camera.view.PreviewView
import androidx.compose.foundation.clickable
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Cameraswitch
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.LifecycleOwner
import androidx.compose.ui.platform.LocalLifecycleOwner
import com.spaktok.android.features.camera.CameraViewModel
import com.spaktok.android.data.repo.MediaRepositoryImpl
import com.spaktok.android.network.OkHttpApiClient

/**
 * Native Camera-Screen Skeleton
 *
 * - Vollbild, Edge-to-Edge
 * - Schwarzer Hintergrund als Platzhalter für Preview-Layer
 * - Overlays für Shutter, Flip, Flash etc.
 */
@Composable
fun CameraScreen() {
    val context = LocalContext.current
    val app = remember(context) { context.applicationContext as Application }
    val api = remember { OkHttpApiClient() }
    val repo = remember { MediaRepositoryImpl(api) }
    val vm: CameraViewModel = viewModel(factory = object : androidx.lifecycle.ViewModelProvider.Factory {
        override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T {
            if (modelClass.isAssignableFrom(CameraViewModel::class.java)) {
                @Suppress("UNCHECKED_CAST")
                return CameraViewModel(app, repo) as T
            }
            throw IllegalArgumentException("Unknown ViewModel class")
        }
    })

    val state by vm.recordingState.collectAsState()
    val lifecycleOwner: LifecycleOwner = LocalLifecycleOwner.current

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        // CameraX Preview
        var preview by remember { mutableStateOf(Preview.Builder().build()) }
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = {
                PreviewView(it).apply {
                    preview.setSurfaceProvider(this.surfaceProvider)
                    vm.bindCamera(preview, lifecycleOwner)
                }
            }
        )

        // Untere Leiste mit Shutter + Controls
        Row(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 32.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Filled.FlashOn,
                contentDescription = "Flash",
                tint = Color.White,
                modifier = Modifier
                    .padding(horizontal = 24.dp)
                    .size(28.dp)
            )

            Icon(
                imageVector = Icons.Filled.RadioButtonUnchecked,
                contentDescription = "Shutter",
                tint = Color.White,
                modifier = Modifier
                    .size(64.dp)
                    .padding(horizontal = 8.dp)
                    .background(Color.Transparent)
                    .clickable { vm.startStopRecording() }
            )

            Icon(
                imageVector = Icons.Filled.Cameraswitch,
                contentDescription = "Switch Camera",
                tint = Color.White,
                modifier = Modifier
                    .padding(horizontal = 24.dp)
                    .size(28.dp)
                    .clickable { vm.switchCamera() }
            )
        }

        // Status-Hinweis
        Text(
            text = state,
            color = Color.White,
            fontSize = 12.sp,
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(16.dp)
        )
    }
}
