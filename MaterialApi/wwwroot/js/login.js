
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>ASTRA | IGQC Login</title>

    <link rel="stylesheet" href="/css/login.css">
</head>

<body>

    <main class="login-page">

        <div class="login-shell">

            <!-- LEFT PROJECT PANEL -->
            <section class="project-panel">

                <div class="project-header">

                    <div class="bdl-logo">
                        BDL
                    </div>

                    <div class="bdl-name">
                        BHARAT DYNAMICS LIMITED
                    </div>

                </div>


                <div class="project-content">

                    <div class="project-label">
                        MANUFACTURING QUALITY SYSTEM
                    </div>

                    <h1>
                        ASTRA
                    </h1>

                    <div class="module-title">
                        Incoming Goods
                        <strong>Quality Check</strong>
                    </div>

                    <div class="module-code">
                        IGQC
                    </div>

                    <div class="project-line"></div>

                    <p>
                        Digital inspection and validation platform
                        for incoming materials, quality verification,
                        and production traceability.
                    </p>

                </div>


                <div class="project-status">

                    <span class="status-indicator"></span>

                    <div>
                        <strong>SYSTEM READY</strong>
                        <small>IGQC services operational</small>
                    </div>

                </div>


                <div class="project-footer">
                    ASTRA <span>•</span> IGQC
                </div>

            </section>


            <!-- LOGIN PANEL -->
            <section class="login-panel">

                <div class="login-box">

                    <div class="login-top">

                        <div class="login-tag">
                            ASTRA / IGQC
                        </div>

                        <div class="secure-label">
                            SECURE ACCESS
                        </div>

                    </div>


                    <h2>
                        Sign in
                    </h2>

                    <p class="login-description">
                        Enter your credentials to access the
                        IGQC application.
                    </p>


                    <form id="loginForm">

                        <div class="form-group">

                            <label for="username">
                                USERNAME
                            </label>

                            <input
                                id="username"
                                type="text"
                                placeholder="Enter username"
                                autocomplete="username"
                                required
                            >

                        </div>


                        <div class="form-group">

                            <label for="password">
                                PASSWORD
                            </label>

                            <input
                                id="password"
                                type="password"
                                placeholder="Enter password"
                                autocomplete="current-password"
                                required
                            >

                        </div>


                        <button
                            id="loginButton"
                            type="submit"
                        >
                            <span>LOGIN</span>
                            <b>→</b>
                        </button>


                        <div
                            id="loginMessage"
                            class="message"
                        ></div>

                    </form>


                    <div class="login-note">

                        <span class="lock-icon">✓</span>

                        <div>
                            <strong>Authorized Users</strong>
                            <small>
                                Access is restricted to authorized personnel.
                            </small>
                        </div>

                    </div>

                </div>


                <footer class="login-footer">

                    <span>ASTRA IGQC</span>

                    <span class="footer-divider">|</span>

                    <span>Quality Management System</span>

                </footer>

            </section>

        </div>

    </main>


    <script src="/js/login.js"></script>

</body>
</html>

