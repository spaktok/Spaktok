import 'package:flutter/material.dart';
import 'package:spaktok_frontend/dataconnect_generated/example.dart';

class MovieDetailScreen extends StatefulWidget {
  final String movieId;

  const MovieDetailScreen({super.key, required this.movieId});

  @override
  State<MovieDetailScreen> createState() => _MovieDetailScreenState();
}

class _MovieDetailScreenState extends State<MovieDetailScreen> {
  GetMovieByIdMovie? _movie;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchMovieDetail();
  }

  Future<void> _fetchMovieDetail() async {
    try {
      final result = await ExampleConnector.instance.getMovieById(id: widget.movieId).execute();
      setState(() {
        _movie = result.data.movie;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        appBar: AppBar(title: Text('Loading...')),
        body: Center(child: CircularProgressIndicator()),
      );
    }
    if (_error != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Error')),
        body: Center(child: Text('Error: $_error')),
      );
    }
    if (_movie == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Not Found')),
        body: const Center(child: Text('Movie not found.')),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text(_movie!.title)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (_movie!.imageUrl.isNotEmpty)
              Image.network(
                _movie!.imageUrl,
                width: double.infinity,
                height: 200,
                fit: BoxFit.cover,
              ),
            const SizedBox(height: 16.0),
            Text(
              _movie!.title,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8.0),
            Text(
              'Genre: ${_movie!.genre ?? 'Unknown'}',
              style: const TextStyle(fontSize: 16, fontStyle: FontStyle.italic),
            ),
            const SizedBox(height: 16.0),
            if (_movie!.metadata != null) ...[
              Text(
                'Rating: ${_movie!.metadata!.rating?.toStringAsFixed(1) ?? 'N/A'}',
                style: const TextStyle(fontSize: 16),
              ),
              Text(
                'Release Year: ${_movie!.metadata!.releaseYear ?? 'N/A'}',
                style: const TextStyle(fontSize: 16),
              ),
              Text(
                'Description: ${_movie!.metadata!.description ?? 'N/A'}',
                style: const TextStyle(fontSize: 16),
              ),
              const SizedBox(height: 16.0),
            ],
            const Text(
              'Reviews:',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8.0),
            if (_movie!.reviews.isEmpty)
              const Text('No reviews yet.')
            else
              ..._movie!.reviews.map((review) => Card(
                    margin: const EdgeInsets.symmetric(vertical: 4.0),
                    child: Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('User: ${review.user.username}', style: const TextStyle(fontWeight: FontWeight.bold)),
                          Text('Rating: ${review.rating ?? 'N/A'}'),
                          Text('Review: ${review.reviewText ?? 'No text'}'),
                          Text('Date: ${review.reviewDate.toLocal().toShortString()}'),
                        ],
                      ),
                    ),
                  )),
          ],
        ),
      ),
    );
  }
}

extension on DateTime {
  String toShortString() {
    return '$year-${month.toString().padLeft(2, '0')}-${day.toString().padLeft(2, '0')}';
  }
}

