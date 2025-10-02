import 'package:flutter/material.dart';
import 'package:spaktok/services/reporting_service.dart';
import 'package:spaktok/services/auth_service.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

class ReportingScreen extends StatefulWidget {
  final String? contentId;
  final String? contentType; // 'post', 'user', 'comment', 'live'
  final String? reportedUserId;

  const ReportingScreen({
    Key? key,
    this.contentId,
    this.contentType,
    this.reportedUserId,
  }) : super(key: key);

  @override
  State<ReportingScreen> createState() => _ReportingScreenState();
}

class _ReportingScreenState extends State<ReportingScreen> {
  final ReportingService _reportingService = ReportingService();
  final AuthService _authService = AuthService();
  final TextEditingController _detailsController = TextEditingController();
  
  String? _selectedReason;
  bool _isSubmitting = false;

  final List<Map<String, dynamic>> _reportReasons = [
    {
      'title': 'Spam',
      'icon': Icons.report,
      'color': Colors.orange,
      'description': 'Repetitive or irrelevant content',
    },
    {
      'title': 'Harassment or Bullying',
      'icon': Icons.person_off,
      'color': Colors.red,
      'description': 'Targeting someone with harmful content',
    },
    {
      'title': 'Hate Speech',
      'icon': Icons.warning,
      'color': Colors.red[900],
      'description': 'Content promoting hatred or discrimination',
    },
    {
      'title': 'Violence or Dangerous Content',
      'icon': Icons.dangerous,
      'color': Colors.red[700],
      'description': 'Content showing or promoting violence',
    },
    {
      'title': 'Nudity or Sexual Content',
      'icon': Icons.no_adult_content,
      'color': Colors.purple,
      'description': 'Inappropriate sexual content',
    },
    {
      'title': 'False Information',
      'icon': Icons.fact_check,
      'color': Colors.blue,
      'description': 'Misleading or false content',
    },
    {
      'title': 'Intellectual Property Violation',
      'icon': Icons.copyright,
      'color': Colors.indigo,
      'description': 'Unauthorized use of copyrighted material',
    },
    {
      'title': 'Self-Harm or Suicide',
      'icon': Icons.health_and_safety,
      'color': Colors.red[800],
      'description': 'Content promoting self-harm',
    },
    {
      'title': 'Scam or Fraud',
      'icon': Icons.money_off,
      'color': Colors.amber[900],
      'description': 'Deceptive or fraudulent content',
    },
    {
      'title': 'Other',
      'icon': Icons.more_horiz,
      'color': Colors.grey,
      'description': 'Other violations not listed above',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('Report Content'),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(),
              const SizedBox(height: 30),
              _buildReasonsList(),
              if (_selectedReason != null) ...[
                const SizedBox(height: 30),
                _buildDetailsSection(),
              ],
              const SizedBox(height: 30),
              _buildSubmitButton(),
              const SizedBox(height: 20),
              _buildInfoSection(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Why are you reporting this?',
          style: TextStyle(
            color: Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 10),
        Text(
          'Your report is anonymous. If someone is in immediate danger, call local emergency services.',
          style: TextStyle(
            color: Colors.grey[400],
            fontSize: 14,
          ),
        ),
      ],
    );
  }

  Widget _buildReasonsList() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Select a reason',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 15),
        ..._reportReasons.map((reason) => _buildReasonItem(reason)).toList(),
      ],
    );
  }

  Widget _buildReasonItem(Map<String, dynamic> reason) {
    final isSelected = _selectedReason == reason['title'];
    
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedReason = reason['title'];
        });
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(
          color: isSelected ? reason['color'].withOpacity(0.2) : Colors.grey[900],
          borderRadius: BorderRadius.circular(15),
          border: Border.all(
            color: isSelected ? reason['color'] : Colors.grey[800]!,
            width: 2,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: reason['color'].withOpacity(0.2),
                shape: BoxShape.circle,
              ),
              child: Icon(
                reason['icon'],
                color: reason['color'],
                size: 24,
              ),
            ),
            const SizedBox(width: 15),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    reason['title'],
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    reason['description'],
                    style: TextStyle(
                      color: Colors.grey[400],
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Icon(
                Icons.check_circle,
                color: reason['color'],
                size: 24,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Additional Details (Optional)',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 15),
        TextField(
          controller: _detailsController,
          maxLines: 5,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: 'Provide more details about this report...',
            hintStyle: TextStyle(color: Colors.grey[600]),
            filled: true,
            fillColor: Colors.grey[900],
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(15),
              borderSide: BorderSide.none,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _selectedReason == null || _isSubmitting ? null : _submitReport,
        style: ElevatedButton.styleFrom(
          backgroundColor: Theme.of(context).primaryColor,
          disabledBackgroundColor: Colors.grey[800],
          padding: const EdgeInsets.symmetric(vertical: 15),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(30),
          ),
        ),
        child: _isSubmitting
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              )
            : const Text(
                'Submit Report',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
      ),
    );
  }

  Widget _buildInfoSection() {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.grey[900],
        borderRadius: BorderRadius.circular(15),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.info_outline,
                color: Theme.of(context).primaryColor,
              ),
              const SizedBox(width: 10),
              const Text(
                'What happens next?',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 15),
          _buildInfoItem('Your report will be reviewed by our moderation team'),
          _buildInfoItem('We may remove content that violates our guidelines'),
          _buildInfoItem('You\'ll receive updates on your report status'),
          _buildInfoItem('Repeated violations may result in account suspension'),
        ],
      ),
    );
  }

  Widget _buildInfoItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            margin: const EdgeInsets.only(top: 5),
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: Theme.of(context).primaryColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                color: Colors.grey[400],
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _submitReport() async {
    if (_selectedReason == null) return;

    setState(() {
      _isSubmitting = true;
    });

    try {
      await _reportingService.submitReport(
        contentId: widget.contentId ?? '',
        contentType: widget.contentType ?? 'post',
        reportedUserId: widget.reportedUserId ?? '',
        reason: _selectedReason!,
        details: _detailsController.text,
      );

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Report submitted successfully. Thank you for helping keep our community safe.'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error submitting report: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _detailsController.dispose();
    super.dispose();
  }
}
