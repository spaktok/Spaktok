import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:spaktok/models/trending_content.dart';
import 'package:spaktok/services/trending_service.dart';
<<<<<<< HEAD
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
=======


>>>>>>> origin/feature/full-implementation

class ExploreScreen extends StatefulWidget {
  const ExploreScreen({Key? key}) : super(key: key);

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  @override
  Widget build(BuildContext context) {
<<<<<<< HEAD
    final appLocalizations = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(
        title: Text(appLocalizations.explore),
=======


    return Scaffold(
      appBar: AppBar(
        title: const Text("Explore"),
>>>>>>> origin/feature/full-implementation
      ),
      body: StreamBuilder<List<TrendingContent>>(
        stream: TrendingService().getTrendingContent(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
<<<<<<< HEAD
            return Center(child: Text('${appLocalizations.error}: ${snapshot.error}'));
          } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return Center(child: Text(appLocalizations.noTrendingContent));
=======
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return Center(child: const Text("No trending content available"));
>>>>>>> origin/feature/full-implementation
          } else {
            final trendingContent = snapshot.data!;
            return GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 8.0,
                mainAxisSpacing: 8.0,
                childAspectRatio: 0.7,
              ),
              padding: const EdgeInsets.all(8.0),
              itemCount: trendingContent.length,
              itemBuilder: (context, index) {
                final content = trendingContent[index];
                return GestureDetector(
                  onTap: () {
                    // TODO: Navigate to content detail screen (story, reel, live stream)
                    print('Tapped on ${content.title}');
                    TrendingService().updateViewsCount(content.id); // Update views count
                  },
                  child: Card(
                    clipBehavior: Clip.antiAlias,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Image.network(
                            content.thumbnailUrl,
                            fit: BoxFit.cover,
                            width: double.infinity,
                            errorBuilder: (context, error, stackTrace) => Center(
                              child: Icon(Icons.broken_image, size: 50, color: Colors.grey[400]),
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(8.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                content.title,
                                style: const TextStyle(fontWeight: FontWeight.bold),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              Text(
                                content.description,
                                style: TextStyle(color: Colors.grey[600]),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              Row(
                                children: [
                                  Icon(Icons.visibility, size: 16, color: Colors.grey[600]),
                                  const SizedBox(width: 4),
                                  Text('${content.viewsCount}', style: TextStyle(color: Colors.grey[600])),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            );
          }
        },
      ),
    );
  }
}

