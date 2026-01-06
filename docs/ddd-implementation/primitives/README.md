# DDD Primitives: Complete Reference

This directory contains comprehensive documentation for all 13 DDD primitives used in this repository. Each primitive has two documents:

1. **specification.md** - Requirements, patterns, examples, testing
2. **enforcement.md** - Automation mapping (ESLint, generators, CI, manual review)

## Primitives Catalog

### Domain Layer (Pure Business Logic)

#### [Entity](./entity/)
> Objects with stable identity that persist across state changes

- **When**: Object has lifecycle, identity matters
- **Base**: `BaseEntity<TId extends Brand<string, any>>`
- **Location**: `src/core/{context}/domain/entities/`
- **Tests**: Unit (core logic, invariants)
- **Observability**: ❌ None (pure domain)

#### [ValueObject](./value-object/)
> Immutable objects defined entirely by their attributes

- **When**: Attributes matter, not identity
- **Base**: `ValueObject<T>`
- **Location**: `src/core/{context}/domain/value-objects/`
- **Tests**: Unit (validation, equality, immutability)
- **Observability**: ❌ None (pure domain)

#### [AggregateRoot](./aggregate-root/)
> Cluster of entities with single root enforcing invariants

- **When**: Cluster must be consistent, transaction boundary needed
- **Base**: `BaseEntity<TId>` + event collection
- **Location**: `src/core/{context}/domain/entities/` (special Entity)
- **Tests**: Unit (aggregate invariants, event emission)
- **Observability**: ❌ None (pure domain)

#### [DomainEvent](./domain-event/)
> Immutable record of significant domain occurrences

- **When**: State change that other parts care about
- **Base**: `DomainEvent` abstract class
- **Location**: `src/core/{context}/domain/events/`
- **Tests**: Unit (serialization, immutability)
- **Observability**: ❌ None (pure domain)

#### [Specification](./specification/) (Policy)
> Encapsulated business rules for validation/selection

- **When**: Complex validation, business rule evaluation
- **Base**: `Specification<T>` interface
- **Location**: `src/core/{context}/domain/policies/`
- **Tests**: Unit (rule logic, composition)
- **Observability**: ❌ None (pure domain)

#### [DomainService](./domain-service/)
> Stateless operations spanning multiple aggregates

- **When**: Logic spans aggregates, coordination needed
- **Base**: None (pure class)
- **Location**: `src/core/{context}/domain/services/`
- **Tests**: Unit (with domain objects)
- **Observability**: ❌ None (pure domain)

#### [Factory](./factory/)
> Complex object creation with validation

- **When**: Multi-step construction, creation from multiple sources
- **Base**: None (pure class with create methods)
- **Location**: `src/core/{context}/domain/factories/`
- **Tests**: Unit (creation logic + validation)
- **Observability**: ❌ None (pure domain)

### Application Layer (Orchestration + Ports)

#### [Command](./command/)
> Serializable, immutable request to mutate application state

- **When**: User/system initiates mutating action
- **Base**: `Command<TResult>` abstract class
- **Location**: `src/core/{context}/application/commands/`
- **Tests**: Unit (validation, serialization)
- **Observability**: ✅ Tracing via commandId + correlationId

#### [Query](./query/)
> Serializable, immutable request to read application state

- **When**: User/system initiates read operation
- **Base**: `Query<TResult>` abstract class
- **Location**: `src/core/{context}/application/queries/`
- **Tests**: Unit (validation, serialization)
- **Observability**: ✅ Tracing via queryId + cacheKey

#### [UseCase](./use-case/)
> Single application operation orchestrating domain logic

- **When**: Command/Query handler, business operation
- **Base**: `BaseUseCase<TInput, TOutput>`
- **Location**: `src/core/{context}/application/use-cases/`
- **Tests**: Unit (core), Integration, E2E
- **Observability**: ✅ Span, logs, metrics (auto via base)

#### [Repository](./repository/) (Port + Adapter)
> Collection-like interface for aggregate persistence

- **Port**: Interface in `application/ports/`
- **Adapter**: Implementation in `infrastructure/adapters/`
- **Base (Adapter)**: `BaseRepositoryAdapter<TPort>`
- **Tests**: Integration (adapter with real DB), E2E
- **Observability**: ✅ Adapter only (span, logs, metrics)

### Interface Layer (Protocol Boundaries)

#### [Handler](./handler/)
> Protocol adapter translating external requests to use cases

- **When**: HTTP endpoint, gRPC method, CLI command, message consumer
- **Base**: `BaseHandler` or protocol-specific (BaseHttpHandler)
- **Location**: `src/core/{context}/interface/handlers/`
- **Tests**: Unit (validation), Integration, E2E
- **Observability**: ✅ Span, logs, metrics (auto via base)

### Cross-Layer Utility

#### [Mapper](./mapper/)
> Pure transformations between layers (domain ↔ DTO ↔ persistence)

- **When**: Domain ↔ DTO, domain ↔ DB record
- **Base**: `BaseMapper` (optional) or static methods
- **Location**: `application/mappers/` (DTO) or `infrastructure/mappers/` (persistence)
- **Tests**: Unit (transformation logic)
- **Observability**: ❌ None (pure functions)

## Observability Summary

### Pure Domain (No Observability)
- Entity, ValueObject, AggregateRoot
- DomainEvent, Specification, DomainService, Factory
- **Rationale**: Domain logic stays pure; observability happens at boundaries

### Boundaries (Full Observability)
- UseCase, Handler, Repository (adapter only)
- **Observability**: Spans, logs, metrics (auto via base classes)

### Utilities (No Observability)
- Mapper
- **Rationale**: Pure transformations, no side effects

## Testing Requirements Summary

| Primitive | Unit (Core) | Integration | E2E |
|-----------|-------------|-------------|-----|
| Entity | ✅ Required | ❌ N/A | ⏭️ Via UseCase |
| ValueObject | ✅ Required | ❌ N/A | ⏭️ Via Entity |
| AggregateRoot | ✅ Required | ❌ N/A | ⏭️ Via UseCase |
| DomainEvent | ✅ Required | ⏭️ Via EventBus | ⏭️ Via UseCase |
| Specification | ✅ Required | ❌ N/A | ⏭️ Via Entity |
| DomainService | ✅ Required | ❌ N/A | ⏭️ Via UseCase |
| Factory | ✅ Required | ❌ N/A | ⏭️ Via UseCase |
| Command | ✅ Required | ⏭️ Via CommandBus | ⏭️ Via Handler |
| Query | ✅ Required | ⏭️ Via QueryBus | ⏭️ Via Handler |
| UseCase | ✅ Required | ✅ Required | ✅ Required |
| Repository (Port) | ❌ N/A (interface) | ❌ N/A | ❌ N/A |
| Repository (Adapter) | ❌ N/A | ✅ Required | ⏭️ Via UseCase |
| Handler | ✅ Required | ✅ Required | ✅ Required |
| Mapper | ✅ Required | ❌ N/A | ⏭️ Via UseCase |

**Legend**: ✅ Required | ❌ Not Applicable | ⏭️ Indirectly Tested

## Enforcement Automation Summary

### Fully Automated (≥70%)
- **Entity**: 70% (ESLint + TypeScript + Generator)
- **ValueObject**: 76% (ESLint + TypeScript + Generator)
- **DomainService**: 70% (ESLint + Generator)
- **UseCase**: 73% (ESLint + Base Class + Generator)
- **Factory**: 73% (ESLint + Generator)
- **Command**: 67% (ESLint + Generator)
- **Query**: 69% (ESLint + Generator)

### Moderately Automated (60-69%)
- **AggregateRoot**: 68% (ESLint + TypeScript + Generator)
- **Handler**: 63% (ESLint + Base Class + Generator)
- **Specification**: 67% (ESLint + Generator)
- **Mapper**: 60% (ESLint + Generator)

### Partially Automated (50-59%)
- **DomainEvent**: 59% (ESLint + Base Class + Generator)
- **Repository**: 58% (ESLint + Base Class + Generator)

## Base Classes Inventory

All base classes are in `src/shared/kernel/`:

| Base Class | Location | Purpose |
|------------|----------|---------|
| `BaseEntity<TId>` | `domain/BaseEntity.ts` | Stable identity + event collection |
| `ValueObject<T>` | `domain/ValueObject.ts` | Immutability + structural equality |
| `DomainEvent` | `events/DomainEvent.ts` | Event ID + occurredOn + serialization |
| `Specification<T>` | `domain/Specification.ts` | isSatisfiedBy + composition (and/or/not) |
| `BaseUseCase<TIn, TOut>` | `application/BaseUseCase.ts` | execute() wrapper + span + validation |
| `BaseRepositoryAdapter<TPort>` | `infrastructure/BaseRepositoryAdapter.ts` | withSpan() helper + metrics |
| `BaseHandler` | `interface/BaseHandler.ts` | withSpan() + correlation ID |
| `BaseMapper` | `infrastructure/BaseMapper.ts` | Pure transformation helpers (optional) |

## Generator Commands

All generators follow the pattern:
```bash
nx generate {primitive} --context={context} --name={Name}
```

Examples:
```bash
nx generate entity --context=identity --name=User
nx generate command --context=orders --name=PlaceOrder --result=Order
nx generate query --context=orders --name=FindOrdersByCustomer --result="Order[]"
nx generate use-case --context=orders --name=PlaceOrder
nx generate handler --context=identity --name=CreateUser --protocol=http
nx generate repository --context=identity --aggregate=User
```

## Quick Decision Tree

**Need to model identity?** → Entity (or AggregateRoot if cluster)  
**Need immutable data?** → ValueObject  
**Need to record what happened?** → DomainEvent  
**Need complex validation rule?** → Specification  
**Need stateless domain logic?** → DomainService  
**Need complex creation?** → Factory  
**Need to mutate state?** → Command (→ UseCase)  
**Need to read state?** → Query (→ UseCase)  
**Need to orchestrate?** → UseCase  
**Need to persist?** → Repository (Port + Adapter)  
**Need external interface?** → Handler  
**Need to transform layers?** → Mapper

## Related Documentation

- [Repository Framework README](../../repo-framework/README.md) - Overall DDD implementation approach
- [Layers README](../../Layers/README.md) - 9-layer architecture + primitive assignment matrix
- [Quick Reference](../../Layers/Quick-Reference.md) - Decision trees + primitive assignment matrix
- [Observability Inventory](../../enforced-architecture/OBSERVABILITY_INVENTORY/README.md) - Tracking observability compliance

## Next Steps

1. **Implement Base Classes**: Create all base classes in `src/shared/kernel/`
2. **Create Generators**: Build Nx generators (with Plop templates) for all 11 primitives
3. **Create ESLint Rules**: Implement custom ESLint plugin with enforcement rules
4. **Set Up CI Jobs**: Add `enforce-file-structure` and `test-coverage-check` jobs
5. **Create Review Checklists**: Add code review checklists for manual enforcement items

For questions or clarifications on any primitive, see the primitive's `specification.md` file.
