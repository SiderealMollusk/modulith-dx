High-Level Architecture
Bounded Contexts - How to structure multiple domains, define context boundaries, handle anti-corruption layers
Module Organization - Multi-team scaling, package/namespace strategy, internal vs public APIs
Dependency Graph - Clear direction of dependencies (who can call whom across contexts)
Advanced DDD Patterns
Aggregate Design - Root selection, composition hierarchy, invariant clusters
Event Sourcing (optional) - How to structure event-sourced vs traditional aggregates
Sagas/Process Managers - Long-running transactions spanning aggregates
CQRS (optional) - Read/write model separation, query optimization
Anti-Corruption Layers - Protecting domain from external system changes
Implementation Details
Identity Strategies - UUID vs surrogate key policies, natural keys
Transaction Boundaries - When to use sagas, accept eventual consistency, batch operations
Event Versioning - How to evolve domain events without breaking handlers
Async Patterns - Command/event handler patterns, async composition
Testing & Observability
DDD-specific Test Patterns - Aggregate behavior tests, domain event assertions, saga choreography
Telemetry Model - Metrics for domain concepts (not just infrastructure), business events
Architecture Decision Records - Document major DDD choices
Working Code
Real Working Example - Complete feature (not skeleton) showing all patterns
Generators - Scaffolding for bounded contexts, aggregates, use cases
Integration Examples - How to wire Repositories, Handlers, Use Cases with DI
Documentation
Ubiquitous Language - Domain terminology glossary
Aggregate Catalog - All aggregates in the system with their boundaries