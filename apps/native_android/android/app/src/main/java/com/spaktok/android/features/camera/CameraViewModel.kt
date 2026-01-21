package com.spaktok.android.features.camera

import android.app.Application
import android.content.ContentValues
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import androidx.camera.core.CameraSelector
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.video.FileOutputOptions
import androidx.camera.video.Recorder
import androidx.camera.video.Recording
import androidx.camera.video.VideoCapture
import androidx.camera.video.VideoRecordEvent
import androidx.camera.video.QualitySelector
import androidx.camera.video.Quality
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import androidx.core.content.ContextCompat
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.io.File
import com.spaktok.android.data.repo.MediaRepository

class CameraViewModel(app: Application, private val mediaRepo: MediaRepository) : AndroidViewModel(app) {

    private val _recordingState = MutableStateFlow("idle")
    val recordingState: StateFlow<String> = _recordingState

    private var videoCapture: VideoCapture<Recorder>? = null
    private var recording: Recording? = null
    private var cameraSelector: CameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

    fun switchCamera() {
        cameraSelector = if (cameraSelector == CameraSelector.DEFAULT_BACK_CAMERA)
            CameraSelector.DEFAULT_FRONT_CAMERA else CameraSelector.DEFAULT_BACK_CAMERA
        _recordingState.value = "camera_switched"
    }

    fun bindCamera(previewUseCase: androidx.camera.core.Preview, lifecycleOwner: androidx.lifecycle.LifecycleOwner) {
        val context = getApplication<Application>()
        val providerFuture = ProcessCameraProvider.getInstance(context)
        providerFuture.addListener({
            val provider = providerFuture.get()
            val recorder = Recorder.Builder()
                .setQualitySelector(QualitySelector.from(Quality.FHD))
                .build()
            videoCapture = VideoCapture.withOutput(recorder)
            try {
                provider.unbindAll()
                provider.bindToLifecycle(lifecycleOwner, cameraSelector, previewUseCase, videoCapture)
                _recordingState.value = "bound"
            } catch (t: Throwable) {
                _recordingState.value = "error_bind"
            }
        }, ContextCompat.getMainExecutor(context))
    }

    fun startStopRecording(roomId: String? = null) {
        val vc = videoCapture ?: return
        if (recording != null) {
            recording?.stop()
            recording = null
            _recordingState.value = "stopping"
            return
        }
        val context = getApplication<Application>()
        val videosDir = context.getExternalFilesDir(Environment.DIRECTORY_MOVIES) ?: context.filesDir
        val file = File(videosDir, "capture_${System.currentTimeMillis()}.mp4")
        val output = FileOutputOptions.Builder(file).build()
        recording = vc.output
            .prepareRecording(context, output)
            .withAudioEnabled()
            .start(ContextCompat.getMainExecutor(context)) { event ->
                when (event) {
                    is VideoRecordEvent.Start -> _recordingState.value = "recording"
                    is VideoRecordEvent.Finalize -> {
                        _recordingState.value = if (event.hasError()) "error_record" else "finalized"
                        if (!event.hasError()) {
                            // Upload asynchronously
                            viewModelScope.launch {
                                mediaRepo.uploadVideo(file).onSuccess {
                                    _recordingState.value = "uploaded"
                                }.onFailure {
                                    _recordingState.value = "error_upload"
                                }
                            }
                        }
                    }
                    else -> {}
                }
            }
    }
}
