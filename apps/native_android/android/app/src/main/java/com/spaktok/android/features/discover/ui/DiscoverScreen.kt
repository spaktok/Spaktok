package com.spaktok.android.features.discover.ui

import android.app.Application
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.paging.compose.collectAsLazyPagingItems
import com.spaktok.android.data.repo.DiscoverRepositoryImpl
import com.spaktok.android.features.discover.DiscoverViewModel
import com.spaktok.android.features.discover.DiscoverViewModelFactory
import com.spaktok.android.network.OkHttpApiClient

@Composable
fun DiscoverScreen() {
    val context = LocalContext.current
    val app = remember(context) { context.applicationContext as Application }
    val api = remember { OkHttpApiClient() }
    val repo = remember { DiscoverRepositoryImpl(api) }
    val vm: DiscoverViewModel = viewModel(factory = DiscoverViewModelFactory(app, repo))

    Box(modifier = Modifier.fillMaxSize().background(Color.Black)) {
        // Content: Explore list
        ExploreTab(vm)

        // Top transparent search overlay
        SearchOverlay(vm, modifier = Modifier
            .align(Alignment.TopCenter)
            .padding(12.dp))
    }
}

@Composable
private fun ExploreTab(vm: DiscoverViewModel) {
    val items = vm.explore.collectAsLazyPagingItems()
    LazyColumn(modifier = Modifier.fillMaxSize()) {
        itemsIndexed(items.itemSnapshotList.items, key = { _, it -> it.id }) { idx, reel ->
            ListItem(
                headlineContent = { Text(reel.description.ifBlank { "Reel ${reel.id}" }) },
                supportingContent = { Text("@${reel.userId}") }
            )
            Divider()
        }
    }
}

@Composable
private fun SearchOverlay(vm: DiscoverViewModel, modifier: Modifier = Modifier) {
    var q by remember { mutableStateOf(TextFieldValue("")) }
    Column(modifier = modifier) {
        OutlinedTextField(
            value = q,
            onValueChange = {
                q = it
                vm.setQuery(it.text)
            },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            label = { Text("Search") }
        )
        // Optional: small dropdown of top 5 search results as overlay
        val items = vm.search.collectAsLazyPagingItems()
        LazyColumn(modifier = Modifier.fillMaxWidth()) {
            itemsIndexed(items.itemSnapshotList.items.take(5), key = { _, it -> it.id }) { _, reel ->
                ListItem(
                    headlineContent = { Text(reel.description.ifBlank { "Reel ${reel.id}" }, color = Color.White) },
                    supportingContent = { Text("@${reel.userId}", color = Color.LightGray) }
                )
                Divider(color = Color(0x33FFFFFF))
            }
        }
    }
}
