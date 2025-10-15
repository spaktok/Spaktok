import 'package:flutter/material.dart';
import '../dataconnect_generated/example.dart';
import 'movie_detail_screen.dart';

class MovieListScreen extends StatefulWidget {
  const MovieListScreen({super.key});

  @override
  State<MovieListScreen> createState() => _MovieListScreenState();
}

class _MovieListScreenState extends State<MovieListScreen> {
  List<ListMoviesMovies> _movies = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchMovies();
  }

  Future<void> _fetchMovies() async {
    try {
      final result = await ExampleConnector.instance.listMovies().execute();
      setState(() {
        _movies = result.data.movies;
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
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(child: Text('Error: $_error'));
    }
    if (_movies.isEmpty) {
      return const Center(child: Text('No movies found.'));
    }

    return ListView.builder(
      itemCount: _movies.length,
      itemBuilder: (context, index) {
        final movie = _movies[index];
        return Card(
          margin: const EdgeInsets.all(8.0),
          child: ListTile(
            leading: movie.imageUrl.isNotEmpty
                ? Image.network(movie.imageUrl, width: 50, height: 50, fit: BoxFit.cover)
                : const Icon(Icons.movie),
            title: Text(movie.title),
            subtitle: Text(movie.genre ?? 'Unknown Genre'),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => MovieDetailScreen(movieId: movie.id),
                ),
              );
            },
          ),
        );
      },
    );
  }
}

