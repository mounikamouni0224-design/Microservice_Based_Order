## Project overview

- `Product Service` is a Java 25 / Spring Boot 4.1 application.
- Persistence uses Spring Data JPA with Hibernate and MySQL.

## Project structure

- Production sources live in `src/main/java`.
- Code is organized by domain/feature.
- Application configuration lives in `src/main/resources/application.yml`.

## Development

- The build uses Maven; always use the checked-in `./mvnw` wrapper.

Run from the repository root:

```shell
./mvnw spring-boot:run
./mvnw test
./mvnw package
```

## Working conventions

- Use constructor injection and follow adjacent Java code and Lombok patterns.
- Run the narrowest meaningful verification while iterating.
- Keep changes task-scoped and preserve unrelated existing changes. When a required file is already modified, integrate with those changes.
- Never commit production credentials. Keep secrets in environment variables or local, unversioned overrides.
- Add concise, verifiable repository-wide guidance discovered during a task to `AGENTS.md`; omit task details and duplicate documentation.
