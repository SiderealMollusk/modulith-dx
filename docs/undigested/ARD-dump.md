# Architecture Decisions - Undigested

## Generator Specification & Enforcement Structure

### Decision
Two-layer system for documenting code generation requirements:

**Layer 1: Primitive Definitions** (13 total, carved in stone)
```
docs/ddd-implementation/primitives/{primitive}/
├── specification.md      ← "What is this primitive in DDD theory?"
└── enforcement.md        ← "How do we verify code conforms to the primitive?"
```

**Layer 2: Generator Implementation Specs** (one per generator)
```
tools/generators/{primitive}/
├── specification.md      ← "What MUST a generated instance of this primitive look like?"
│                            (exact constructor signature, required methods, property shapes, test layout)
└── enforcement.md        ← "How do we verify the GENERATED code is correct?"
│                            (ESLint rules it must pass, test file paths, CI validation)
```

### Rationale
- **Clear scope**: Primitive defs are abstract DDD theory; generator specs are concrete implementation requirements
- **Generator has marching orders**: Generator spec is the acceptance criteria for code generation
- **Anti-drift**: Enforcement doc in generator folder validates that generated instances match their spec
- **Separates concerns**: Architects refine primitive defs; engineers write generators targeting generator specs

### Implication
- Primitive definitions rarely change (these are DDD principles)
- Generator specs change when we refine how instances should be shaped
- Each generator validates its output against its own enforcement.md before success
- CI can verify all generated instances comply with their primitive's generator spec

### Notes
- The 13 primitives are fixed: Entity, ValueObject, AggregateRoot, DomainEvent, Specification, DomainService, Factory, Command, Query, UseCase, Repository, Handler, Mapper
- Generator specs are the source of truth for what `nx generate entity --context=identity --name=User` produces
- No versioning of generator specs initially; they evolve in-place with PR review
