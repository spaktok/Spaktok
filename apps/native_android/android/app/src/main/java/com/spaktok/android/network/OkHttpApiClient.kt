package com.spaktok.android.network

import android.util.Log
import com.spaktok.android.core.ApiConfig
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.MultipartBody
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.Response
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * OkHttp-based implementation of [ApiClient]. Keeps configuration centralized via [ApiConfig].
 */
class OkHttpApiClient : ApiClient {

    @Volatile
    private var authToken: String? = null

    fun setAuthToken(token: String?) {
        authToken = token
    }

    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .build()

    override suspend fun get(path: String, query: Map<String, String>?): Map<String, Any?> {
        val urlBuilder = (ApiConfig.baseUrl + path).toHttpUrlOrNull()?.newBuilder()
            ?: throw IllegalArgumentException("Invalid URL base or path")
        query?.forEach { (k, v) -> urlBuilder.addQueryParameter(k, v) }
        val req = Request.Builder().url(urlBuilder.build()).get().build()
        return execute(req)
    }

    override suspend fun post(
        path: String,
        body: Map<String, Any?>?,
        query: Map<String, String>?
    ): Map<String, Any?> {
        val urlBuilder = (ApiConfig.baseUrl + path).toHttpUrlOrNull()?.newBuilder()
            ?: throw IllegalArgumentException("Invalid URL base or path")
        query?.forEach { (k, v) -> urlBuilder.addQueryParameter(k, v) }
        val json = JSONObject(body ?: emptyMap<String, Any?>()).toString()
        val media = "application/json; charset=utf-8".toMediaType()
        val reqBody: RequestBody = json.toRequestBody(media)
        val req = Request.Builder().url(urlBuilder.build()).post(reqBody).build()
        return execute(req)
    }

    override suspend fun put(
        path: String,
        body: Map<String, Any?>?,
        query: Map<String, String>?
    ): Map<String, Any?> {
        val urlBuilder = (ApiConfig.baseUrl + path).toHttpUrlOrNull()?.newBuilder()
            ?: throw IllegalArgumentException("Invalid URL base or path")
        query?.forEach { (k, v) -> urlBuilder.addQueryParameter(k, v) }
        val json = JSONObject(body ?: emptyMap<String, Any?>()).toString()
        val media = "application/json; charset=utf-8".toMediaType()
        val reqBody: RequestBody = json.toRequestBody(media)
        val req = Request.Builder().url(urlBuilder.build()).put(reqBody).build()
        return execute(req)
    }

    override suspend fun delete(path: String, query: Map<String, String>?): Map<String, Any?> {
        val urlBuilder = (ApiConfig.baseUrl + path).toHttpUrlOrNull()?.newBuilder()
            ?: throw IllegalArgumentException("Invalid URL base or path")
        query?.forEach { (k, v) -> urlBuilder.addQueryParameter(k, v) }
        val req = Request.Builder().url(urlBuilder.build()).delete().build()
        return execute(req)
    }

    override suspend fun upload(
        path: String,
        fileParamName: String,
        fileName: String,
        bytes: ByteArray,
        query: Map<String, String>?,
        extraFields: Map<String, String>?
    ): Map<String, Any?> {
        val urlBuilder = (ApiConfig.baseUrl + path).toHttpUrlOrNull()?.newBuilder()
            ?: throw IllegalArgumentException("Invalid URL base or path")
        query?.forEach { (k, v) -> urlBuilder.addQueryParameter(k, v) }
        val multipart = MultipartBody.Builder().setType(MultipartBody.FORM).apply {
            extraFields?.forEach { (k, v) -> addFormDataPart(k, v) }
            val media = "application/octet-stream".toMediaType()
            addFormDataPart(fileParamName, fileName, bytes.toRequestBody(media))
        }.build()
        val req = Request.Builder().url(urlBuilder.build()).post(multipart).build()
        return execute(req)
    }

    private fun execute(request: Request): Map<String, Any?> {
        val reqWithAuth = authToken?.let { token ->
            request.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        } ?: request
        client.newCall(reqWithAuth).execute().use { resp ->
            return parseResponse(resp)
        }
    }

    private fun parseResponse(resp: Response): Map<String, Any?> {
        val code = resp.code
        val bodyStr = resp.body?.string() ?: ""
        if (code !in 200..299) {
            Log.w("ApiClient", "HTTP $code: ${requestSummary(resp)}")
            return mapOf("status" to code, "error" to true, "body" to bodyStr)
        }
        if (bodyStr.isBlank()) return emptyMap()
        return try {
            when {
                bodyStr.trim().startsWith("[") -> {
                    // Wrap JSON array into a map to satisfy the interface
                    val arr = JSONArray(bodyStr)
                    mapOf("items" to parseArray(arr))
                }
                else -> {
                    val obj = JSONObject(bodyStr)
                    parseObject(obj)
                }
            }
        } catch (e: JSONException) {
            Log.e("ApiClient", "JSON parse error", e)
            mapOf("raw" to bodyStr)
        }
    }

    private fun parseObject(obj: JSONObject): Map<String, Any?> {
        val result = mutableMapOf<String, Any?>()
        val keys = obj.keys()
        while (keys.hasNext()) {
            val k = keys.next()
            val v = obj.get(k)
            result[k] = when (v) {
                is JSONObject -> parseObject(v)
                is JSONArray -> parseArray(v)
                JSONObject.NULL -> null
                else -> v
            }
        }
        return result
    }

    private fun parseArray(arr: JSONArray): List<Any?> {
        val list = ArrayList<Any?>(arr.length())
        for (i in 0 until arr.length()) {
            val v = arr.get(i)
            list.add(
                when (v) {
                    is JSONObject -> parseObject(v)
                    is JSONArray -> parseArray(v)
                    JSONObject.NULL -> null
                    else -> v
                }
            )
        }
        return list
    }

    private fun requestSummary(resp: Response): String {
        val req = resp.request
        return "${req.method} ${req.url} -> ${resp.code}"
    }
}
