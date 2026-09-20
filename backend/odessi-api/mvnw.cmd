@REM ============================================================================
@REM Maven Wrapper startup script for Windows
@REM Handles paths with spaces correctly.
@REM ============================================================================
@SETLOCAL

@SET JAVA_HOME_OVERRIDE=C:\Program Files\Java\jdk-25.0.2
@IF NOT "%JAVA_HOME%" == "" SET JAVA_HOME_OVERRIDE=%JAVA_HOME%

@SET MAVEN_PROJECTBASEDIR=%~dp0
@IF "%MAVEN_PROJECTBASEDIR:~-1%"=="\" SET MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%

@SET WRAPPER_JAR="%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"
@SET WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain

@SET JAVA_EXE="%JAVA_HOME_OVERRIDE%\bin\java.exe"

@IF NOT EXIST %JAVA_EXE% (
    @ECHO Error: Java not found at %JAVA_EXE% >&2
    @EXIT /B 1
)

@IF NOT EXIST %WRAPPER_JAR% (
    @ECHO Error: maven-wrapper.jar not found at %WRAPPER_JAR% >&2
    @EXIT /B 1
)

%JAVA_EXE% "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" -cp %WRAPPER_JAR% %WRAPPER_LAUNCHER% %*
@ENDLOCAL
