# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-03-11

### Added
- Initial project setup — FastAPI + SQLite + Docker
- Strava OAuth2 authentication with automatic token refresh
- Activity sync from Strava with kcal calculated from kilojoules (total work)
- Activity list with card layout and clickable detail view
- Nutrition badge 🥗 on activity cards when food has been logged
- "Tracked Activities" counter in Statistics tab
- Food database with full nutritional fields per 100g: calories, carbohydrates, sugars, proteins, fats, saturated fats, salt, fibers
- CSV import / export for food database
- Nutrition logging — associate foods and quantities to each activity
- Nutrition summary per activity (total kcal and carbs intake)
- Statistics tab: total activities, total distance, total calories burned, tracked activities
- Tab-based UI: Activities & Nutrition, Food Database, Statistics
- Docker + docker-compose support
- `start.sh` convenience script for local development
