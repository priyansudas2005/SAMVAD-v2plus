class ConfidenceCalibrator:
    @staticmethod
    def calibrate_confidence(qa_confidence: float, retrieval_score: float) -> float:
        """
        Calibrate extractive logit products with retrieval similarity scores.
        Ensures low retrieval match scores temper model spans.
        """
        # Linear product scaling
        score = qa_confidence * min(1.0, max(0.0, retrieval_score * 2.0))
        return round(score, 3)

    @staticmethod
    def get_confidence_label(score: float) -> str:
        if score >= 0.80:
            return "Very High"
        if score >= 0.60:
            return "High"
        if score >= 0.40:
            return "Medium"
        if score >= 0.30:
            return "Low"
        return "Not Found"
