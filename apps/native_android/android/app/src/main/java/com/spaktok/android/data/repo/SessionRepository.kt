package com.spaktok.android.data.repo

import com.spaktok.android.core.ApiEndpoints
import com.spaktok.android.network.ApiClient

interface SessionRepository {
    /** Ensures a valid session exists and returns its token (e.g., JWT/opaque). */
    suspend fun ensureSession(): Result<String>
}

class SessionRepositoryImpl(private val api: ApiClient) : SessionRepository {
    override suspend fun ensureSession(): Result<String> = try {
        val res = api.post(ApiEndpoints.SESSION_CREATE, emptyMap())
        val data = (res["data"] as? Map<*, *>) ?: res
        val token = (
            data["token"]
                ?: data["sessionToken"]
                ?: data["jwt"]
                ?: data["accessToken"]
        ) as? String
        if (!token.isNullOrBlank()) Result.success(token!!) else Result.failure(IllegalStateException("Missing session token"))
    } catch (t: Throwable) { Result.failure(t) }
}
