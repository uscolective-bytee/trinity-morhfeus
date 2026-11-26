# Trinity: úplný index zdrojových modulov

Generované zo zdrojov na commite `a0925580c99dc80cb01a7b0362983d719df8baf1`. Pracovný strom môže obsahovať rozpracované úpravy; index nie je doklad nasadenia ani pripojenia služieb.

Spusti znovu: `node scripts/build-owner-reference.mjs`. Zoznam exportov je statický index, nie zoznam povolených nástrojov. Aktuálne oprávnenia a schémy sa zisťujú cez autorizovaný katalóg.

## src: každý zdrojový modul

<details>
<summary>src/agent-sandbox.js</summary>

[Otvoriť zdroj](../src/agent-sandbox.js)

Exportované rozhrania: `customAgentSchema`, `agentExecutionSchema`, `domainProvisionSchema`, `ensureAgentSandboxTables`, `listCustomAgents`, `createOrUpdateCustomAgent`, `executeCustomAgent`, `provisionAgentDomain`.

</details>

<details>
<summary>src/ai-providers.js</summary>

[Otvoriť zdroj](../src/ai-providers.js)

Exportované rozhrania: `aiProviderInputSchema`, `sanitizeApiKey`, `GEMINI_OPERATOR_ACTIONS`, `GEMINI_OPERATOR_POLICY`, `recordAIProviderCheck`, `listAIProviders`, `configureAIProvider`, `geminiProjectControlEnabled`, `getConfiguredAIProvider`.

</details>

<details>
<summary>src/api-builder.js</summary>

[Otvoriť zdroj](../src/api-builder.js)

Exportované rozhrania: `apiDefinitionSchema`, `listApis`, `createApi`, `invokeApi`, `invokeApiBySlug`.

</details>

<details>
<summary>src/api-keys.js</summary>

[Otvoriť zdroj](../src/api-keys.js)

Exportované rozhrania: `createApiKeySchema`, `listApiKeys`, `createApiKey`, `revokeApiKey`, `authenticateApiKey`.

</details>

<details>
<summary>src/architecture.js</summary>

[Otvoriť zdroj](../src/architecture.js)

Exportované rozhrania: `VERIFIED_ARCHITECTURE_CONTEXT`.

</details>

<details>
<summary>src/artifacts.js</summary>

[Otvoriť zdroj](../src/artifacts.js)

Exportované rozhrania: `MIME_TYPES`, `guessContentType`, `sanitizeFilename`, `generateSimplePdf`, `createArtifact`, `createPdfArtifact`, `listArtifacts`, `getArtifact`.

</details>

<details>
<summary>src/audit-log.js</summary>

[Otvoriť zdroj](../src/audit-log.js)

Exportované rozhrania: `categorizeAction`, `determineSeverity`, `extractActor`, `generateEventSummary`, `queryAuditEvents`, `exportAuditEvents`, `recordAuditEvent`.

</details>

<details>
<summary>src/banking-commodity-advanced.js</summary>

[Otvoriť zdroj](../src/banking-commodity-advanced.js)

Exportované rozhrania: `priceAlertSchema`, `invoiceGenerateSchema`, `calculateSupportResistance`, `createPriceAlert`, `listPriceAlerts`, `checkPriceAlerts`, `generateInvoiceWithSepaQr`, `listGeneratedInvoices`, `getAggregatedNetWorth`.

</details>

<details>
<summary>src/brain.js</summary>

[Otvoriť zdroj](../src/brain.js)

Exportované rozhrania: `QuantumBrain`, `runBrainCycle`.

</details>

<details>
<summary>src/capability-status.js</summary>

[Otvoriť zdroj](../src/capability-status.js)

Exportované rozhrania: `summarizeCapabilities`, `capabilityStatus`.

</details>

<details>
<summary>src/chat-routing.js</summary>

[Otvoriť zdroj](../src/chat-routing.js)

Exportované rozhrania: `selectChatProvider`, `BEST_PROVIDER_ORDER`, `pickChatProvider`.

</details>

<details>
<summary>src/cognition.js</summary>

[Otvoriť zdroj](../src/cognition.js)

Exportované rozhrania: `normalizeLanguage`, `languageDirective`, `KNOWLEDGE_DIRECTIVE`, `REASONING_DIRECTIVE`, `COMMUNICATION_STYLE`, `CHATGPT_CAPABILITIES_DIRECTIVE`, `ANTIGRAVITY_CAPABILITIES_DIRECTIVE`, `UNIFIED_TRINITY_DIRECTIVE`, `TRINITY_LOYALTY_OATH`, `tokenBudget`.

</details>

<details>
<summary>src/commodities-engine.js</summary>

[Otvoriť zdroj](../src/commodities-engine.js)

Exportované rozhrania: `BANK_PROVIDERS`, `bankConnectionInputSchema`, `COMMODITY_SECTORS`, `COMMODITY_SECTOR_LABELS`, `ALL_COMMODITIES`, `commodityAnalyzeSchema`, `commodityTradeSchema`, `commodityAutoInvestSchema`, `ensureCommodityPortfolio`, `buildSepaEpcQrPayload`, `listBankConnections`, `configureBankConnection`, `deleteBankConnection`, `syncLiveMarketFeeds`, `analyzeCommodities`, `getCommodityDeskOverview`, `executeCommodityTrade`, `runAutonomousCommodityDesk`, `getCommodityChart`.

</details>

<details>
<summary>src/connection-guidance.js</summary>

[Otvoriť zdroj](../src/connection-guidance.js)

Exportované rozhrania: `connectionGuidance`.

</details>

<details>
<summary>src/control.js</summary>

[Otvoriť zdroj](../src/control.js)

Exportované rozhrania: `readControl`, `assertRunning`.

</details>

<details>
<summary>src/copilot-agent.js</summary>

[Otvoriť zdroj](../src/copilot-agent.js)

Exportované rozhrania: `TrinityCopilotAgent`.

</details>

<details>
<summary>src/copilot-options.js</summary>

[Otvoriť zdroj](../src/copilot-options.js)

Exportované rozhrania: `copilotChatOptionsSchema`.

</details>

<details>
<summary>src/copilot-plugins.js</summary>

[Otvoriť zdroj](../src/copilot-plugins.js)

Exportované rozhrania: `BUILTIN_COPILOT_PLUGINS`, `copilotPluginRegistry`, `copilotPlugins`, `assertCopilotSkillEnabled`.

</details>

<details>
<summary>src/daily-planner.js</summary>

[Otvoriť zdroj](../src/daily-planner.js)

Exportované rozhrania: `dailyPlanShape`, `dailyPlanSchema`, `DAILY_PLANNER_INSTRUCTIONS`, `createDailyPlan`.

</details>

<details>
<summary>src/developer-hub.js</summary>

[Otvoriť zdroj](../src/developer-hub.js)

Exportované rozhrania: `devHubActionSchema`, `getDevHubStatus`, `executeDevHubCommand`.

</details>

<details>
<summary>src/domain-desk-advanced.js</summary>

[Otvoriť zdroj](../src/domain-desk-advanced.js)

Exportované rozhrania: `escrowDealSchema`, `escrowSettleSchema`, `cloneEnvSchema`, `telegramConfigSchema`, `generateEscrowLandingHtml`, `createEscrowDeal`, `settleEscrowDeal`, `getTelegramConfig`, `saveTelegramConfig`, `sendTelegramAlert`, `checkDomainsAndSslHealth`, `listDomainAlerts`, `cloneDomainEnvironment`.

</details>

<details>
<summary>src/domain-environments.js</summary>

[Otvoriť zdroj](../src/domain-environments.js)

Exportované rozhrania: `ENVIRONMENT_NAMES`, `ENVIRONMENT_TEMPLATES`, `provisionDomainEnvSchema`, `deployDomainEnvSchema`, `generateEnvironmentHtml`, `provisionDomainWithEnvironments`, `deployDomainEnvironment`, `TWENTY_STARTER_CLOUDFLARE_DOMAINS`, `seedTwentyCloudflareDomains`, `listDomainEnvironments`, `handlePublicSiteRoute`.

</details>

<details>
<summary>src/domains.js</summary>

[Otvoriť zdroj](../src/domains.js)

Exportované rozhrania: `DOMAIN_STATUSES`, `LISTING_TYPES`, `DNS_RECORD_TYPES`, `domainNameSchema`, `domainInputSchema`, `domainRegistrationSchema`, `domainSaleListingSchema`, `domainSaleSchema`, `domainLeaseListingSchema`, `domainLeaseSchema`, `domainEndLeaseSchema`, `dnsRecordInputSchema`, `checkDomainAvailability`, `listDomains`, `getDomain`, `createDomain`, `registerDomain`, `updateDomain`, `deleteDomain`, `listDomainForSale`, `sellDomain`, `listDomainForLease`, `leaseDomain`, `endDomainLease`, `listDomainTransactions`, `getDomainMarketplace`, `listDnsRecords`, `addDnsRecord`, `deleteDnsRecord`, `searchDomainNames`, `refreshDomainRegistration`, `syncCloudflareDomains`, `createSubdomain`.

</details>

<details>
<summary>src/email.js</summary>

[Otvoriť zdroj](../src/email.js)

Exportované rozhrania: `handleInboundEmail`.

</details>

<details>
<summary>src/engine.js</summary>

[Otvoriť zdroj](../src/engine.js)

Exportované rozhrania: `parseAction`, `executionPolicyForProvider`, `runAgent`.

</details>

<details>
<summary>src/evolution.js</summary>

[Otvoriť zdroj](../src/evolution.js)

Exportované rozhrania: `runEvolutionCycle`.

</details>

<details>
<summary>src/extended-catalog.js</summary>

[Otvoriť zdroj](../src/extended-catalog.js)

Exportované rozhrania: `EXTENDED_SKILLS`, `EXTENDED_PLUGINS`.

</details>

<details>
<summary>src/external-integrations.js</summary>

[Otvoriť zdroj](../src/external-integrations.js)

Exportované rozhrania: `manageCloudflare`, `manageGitHub`, `scrapeWithFirecrawl`, `manageFirebase`, `listAllIntegrations`.

</details>

<details>
<summary>src/fast-chat.js</summary>

[Otvoriť zdroj](../src/fast-chat.js)

Exportované rozhrania: `FAST_TOOLS`, `fastChatInstructions`, `directChatTool`.

</details>

<details>
<summary>src/followup.js</summary>

[Otvoriť zdroj](../src/followup.js)

Exportované rozhrania: `createFollowupJob`.

</details>

<details>
<summary>src/free-modules.js</summary>

[Otvoriť zdroj](../src/free-modules.js)

Exportované rozhrania: `FREE_MODULES_CATALOG`, `fetchWeather`, `fetchWikipedia`, `resolveDns`, `fetchCryptoMarkets`, `fetchTechNews`, `fetchWorldBankIndicator`.

</details>

<details>
<summary>src/google-auth.js</summary>

[Otvoriť zdroj](../src/google-auth.js)

Exportované rozhrania: `isGoogleAdminEmail`, `resolveGoogleRedirectUri`, `googleOAuthConfigured`, `googleAuthRequired`, `verifyGoogleIdToken`, `beginGoogleLogin`, `finishGoogleLogin`.

</details>

<details>
<summary>src/graph-memory.js</summary>

[Otvoriť zdroj](../src/graph-memory.js)

Exportované rozhrania: `nodeTypeSchema`, `edgeRelSchema`, `graphNodeInputSchema`, `graphEdgeInputSchema`, `syncGraphFromEcosystem`, `getGraphVisualization`, `queryGraphContext`.

</details>

<details>
<summary>src/index.js</summary>

[Otvoriť zdroj](../src/index.js)

Exportované rozhrania: modul bez priamo deklarovaného pomenovaného exportu; pozri zdroj a reexporty.

</details>

<details>
<summary>src/infrastructure.js</summary>

[Otvoriť zdroj](../src/infrastructure.js)

Exportované rozhrania: `cloudflareToken`, `cloudflareAccount`, `cloudflareRequest`, `infrastructureStatus`, `hostingInput`, `hostStudioProject`, `listHostedSites`.

</details>

<details>
<summary>src/integration-readiness.js</summary>

[Otvoriť zdroj](../src/integration-readiness.js)

Exportované rozhrania: `integrationReadiness`.

</details>

<details>
<summary>src/jobs.js</summary>

[Otvoriť zdroj](../src/jobs.js)

Exportované rozhrania: `jobSchema`, `createJob`, `getJob`, `listJobs`.

</details>

<details>
<summary>src/legacy.js</summary>

[Otvoriť zdroj](../src/legacy.js)

Exportované rozhrania: `TrinityAgent`, `ChatAgent`, `GuardianAgent`.

</details>

<details>
<summary>src/maintenance-scan.js</summary>

[Otvoriť zdroj](../src/maintenance-scan.js)

Exportované rozhrania: `scanForImprovements`.

</details>

<details>
<summary>src/market-data.js</summary>

[Otvoriť zdroj](../src/market-data.js)

Exportované rozhrania: `MARKET_DATA_SOURCE_LABEL`, `FX_SOURCE_LABEL`, `UNVERIFIED_SOURCE_LABEL`, `MARKET_CACHE_TTL_MS`, `MAX_QUOTE_AGE_DAYS`, `MARKET_SOURCES`, `getMarketSource`, `TIMEFRAMES`, `ANALYSIS_SERIES`, `normalizeTimeframe`, `sma`, `ema`, `rsi`, `atr`, `macd`, `lastOf`, `getFxRate`, `parseYahooChart`, `getMarketSeries`, `pctChangeOverDays`, `pctChangeVsPreviousClose`.

</details>

<details>
<summary>src/mcp.js</summary>

[Otvoriť zdroj](../src/mcp.js)

Exportované rozhrania: `handleMcp`.

</details>

<details>
<summary>src/media.js</summary>

[Otvoriť zdroj](../src/media.js)

Exportované rozhrania: `mediaStatus`.

</details>

<details>
<summary>src/memory-context.js</summary>

[Otvoriť zdroj](../src/memory-context.js)

Exportované rozhrania: `memorySearchTerms`, `selectMemoryRecords`, `sanitizeMemoryRecords`, `formatMemoryContext`.

</details>

<details>
<summary>src/memorySkill.js</summary>

[Otvoriť zdroj](../src/memorySkill.js)

Exportované rozhrania: `memorySkills`.

</details>

<details>
<summary>src/model-action-parser.js</summary>

[Otvoriť zdroj](../src/model-action-parser.js)

Exportované rozhrania: `parseModelAction`.

</details>

<details>
<summary>src/multimedia-studio.js</summary>

[Otvoriť zdroj](../src/multimedia-studio.js)

Exportované rozhrania: `MUSIC_GENRES`, `VIDEO_STYLES`, `PRESENTATION_THEMES`, `PHOTO_STYLES`, `CREATIVE_PACK_TYPES`, `generateMusicSchema`, `generateVideoSchema`, `generatePresentationSchema`, `generateCreativePackSchema`, `generatePhotoStudioSchema`, `ensureMultimediaSchema`, `listMultimediaCreations`, `synthesizeWavBytes`, `generateMusicTrack`, `renderInteractiveVideoPlayerHtml`, `generateVideoCreation`, `renderPresentationDeckHtml`, `generatePresentationDeck`, `renderHighResSvgArtwork`, `generatePhotoCreation`, `generateCreativePack`.

</details>

<details>
<summary>src/neural_brain.js</summary>

[Otvoriť zdroj](../src/neural_brain.js)

Exportované rozhrania: `BRAIN_MODES`, `NeuralMemorySystem`, `NeuralBrain`, `NeuralBrainAgent`.

</details>

<details>
<summary>src/orchestrator.js</summary>

[Otvoriť zdroj](../src/orchestrator.js)

Exportované rozhrania: `WORKER_CATALOG`, `AUXILIARY_WORKER_CATALOG`, `delegateWorker`, `orchestratePipeline`, `inspectFleet`.

</details>

<details>
<summary>src/paypal-rest.js</summary>

[Otvoriť zdroj](../src/paypal-rest.js)

Exportované rozhrania: `getPayPalBaseUrl`, `isPayPalConfigured`, `getPayPalAccessToken`, `createPayPalOrder`, `capturePayPalOrder`, `getPayPalOrderStatus`, `paypalDiagnostics`.

</details>

<details>
<summary>src/planner.js</summary>

[Otvoriť zdroj](../src/planner.js)

Exportované rozhrania: `planTask`.

</details>

<details>
<summary>src/plugins.js</summary>

[Otvoriť zdroj](../src/plugins.js)

Exportované rozhrania: `pluginEnabled`, `listPlugins`, `installPlugin`, `installAllPlugins`, `ensureToolEnabled`, `PLUGINS`.

</details>

<details>
<summary>src/practical-skills.js</summary>

[Otvoriť zdroj](../src/practical-skills.js)

Exportované rozhrania: `PRACTICAL_TOOL_SCHEMAS`, `PRACTICAL_TOOL_NAMES`, `PRACTICAL_TOOL_HELP`, `runPracticalTool`.

</details>

<details>
<summary>src/preview-mode.js</summary>

[Otvoriť zdroj](../src/preview-mode.js)

Exportované rozhrania: `isBuildOnlyPreview`, `buildOnlyPreviewResponse`.

</details>

<details>
<summary>src/project-evolution.js</summary>

[Otvoriť zdroj](../src/project-evolution.js)

Exportované rozhrania: `PROJECT_REPOSITORY`, `githubRequest`, `editableSource`, `rankProjectFiles`, `inspectProject`, `readProjectSource`, `validateSourcePatch`, `prepareCodeImprovement`, `dispatchDeployment`, `automaticMergeAllowed`, `mergeVerifiedImprovement`.

</details>

<details>
<summary>src/qca.js</summary>

[Otvoriť zdroj](../src/qca.js)

Exportované rozhrania: `QCA`, `compressContext`, `runParallelThoughts`, `mergeThoughts`, `selfReflect`, `selfCorrect`.

</details>

<details>
<summary>src/quantum_core.js</summary>

[Otvoriť zdroj](../src/quantum_core.js)

Exportované rozhrania: `QuantumCoreEngine`.

</details>

<details>
<summary>src/quantum_pipeline.js</summary>

[Otvoriť zdroj](../src/quantum_pipeline.js)

Exportované rozhrania: `processTeleologicalPrompt`.

</details>

<details>
<summary>src/registry.js</summary>

[Otvoriť zdroj](../src/registry.js)

Exportované rozhrania: `SKILLS`, `selectSkills`, `AGENTS`, `agentById`, `shouldDelegate`, `selectTeam`.

</details>

<details>
<summary>src/revolut.js</summary>

[Otvoriť zdroj](../src/revolut.js)

Exportované rozhrania: `normalizeRevolutInput`, `normalizePaypalInput`, `proPaymentUrl`, `paypalPaymentUrl`, `proProductSchema`, `paypalProductSchema`, `proCatalogSchema`, `paypalCatalogSchema`, `commerceAccountsSchema`, `revolutProStatus`, `configureRevolutPro`, `paypalStatus`, `configurePaypal`, `commerceStatus`, `configureCommerceAccounts`, `upsertCommerceProduct`, `deleteCommerceProduct`, `handleRevolutProPublic`, `handlePaypalPublic`, `handleCommercePublic`.

</details>

<details>
<summary>src/secret-vault.js</summary>

[Otvoriť zdroj](../src/secret-vault.js)

Exportované rozhrania: `secretInputSchema`, `listSecrets`, `storeSecret`, `getSecretMaterial`, `resolveProviderSecret`, `isGeminiCandidate`, `promoteCustomSecretToGemini`, `verifySecret`, `revokeSecret`.

</details>

<details>
<summary>src/security.js</summary>

[Otvoriť zdroj](../src/security.js)

Exportované rozhrania: `HttpError`, `hash`, `equal`, `isOwnerEmail`, `validKey`, `localLoopbackRequest`, `sessionCookie`, `issueSession`, `allowDevConnection`, `authenticate`, `checkOrigin`, `readJSON`, `rateLimit`, `secure`.

</details>

<details>
<summary>src/self-improvement.js</summary>

[Otvoriť zdroj](../src/self-improvement.js)

Exportované rozhrania: `listSelfImprovementProposals`, `createSelfImprovementProposal`, `approveSelfImprovementProposal`, `applySelfImprovementProposal`, `listActiveBehaviorRules`, `revokeBehaviorRule`, `ownerLearnBehaviorRule`, `behaviorRulesDirective`, `reconcileSelfImprovements`.

</details>

<details>
<summary>src/services.js</summary>

[Otvoriť zdroj](../src/services.js)

Exportované rozhrania: `SERVICES`, `EXTENDED_SERVICES`, `boundedText`, `serviceStatus`, `readiness`, `runScheduledHealth`, `getOllamaKey`, `extractModelText`, `extractGeminiInteractionText`, `usableModelText`, `callModel`.

</details>

<details>
<summary>src/shared-notes.js</summary>

[Otvoriť zdroj](../src/shared-notes.js)

Exportované rozhrania: `sharedNotesInput`, `syncSharedNotes`.

</details>

<details>
<summary>src/skillRegistry.js</summary>

[Otvoriť zdroj](../src/skillRegistry.js)

Exportované rozhrania: `memorySessions`, `coreSkills`, `integrationSkills`, `extendedEngineeringSkills`, `userSkills`, `chatGptSkills`, `DEFAULT_DATAVERSE_URL`, `DEFAULT_DATAVERSE_ORG_ID`, `DEFAULT_DATAVERSE_ENV_ID`, `dataverseSkills`, `geminiDeveloperSkills`, `studioSkills`, `copilotStudioSkills`, `productivityPlusSkills`, `quantumSkills`, `neuralBrainSkills`, `domainSkills`, `coreCatalogSkills`, `catalogSkills`, `skills`, `skillRegistry`.

</details>

<details>
<summary>src/studio-review.js</summary>

[Otvoriť zdroj](../src/studio-review.js)

Exportované rozhrania: `reviewRequestSchema`, `auditHtmlQuality`, `recordStudioReview`.

</details>

<details>
<summary>src/studio.js</summary>

[Otvoriť zdroj](../src/studio.js)

Exportované rozhrania: `studioGenerationPlan`, `listStudioProjects`, `getStudioProject`, `createStudioProject`, `reviseStudioProject`.

</details>

<details>
<summary>src/system-actions.js</summary>

[Otvoriť zdroj](../src/system-actions.js)

Exportované rozhrania: `SYSTEM_CAPABILITIES`, `systemActionSchema`, `getPCBridgeStatus`, `createSystemAction`, `getSystemAction`, `listSystemActions`, `approveSystemAction`, `rejectSystemAction`, `claimSystemAction`, `finishSystemAction`, `authenticateGateway`, `actionEvidence`.

</details>

<details>
<summary>src/telegram-bridge.js</summary>

[Otvoriť zdroj](../src/telegram-bridge.js)

Exportované rozhrania: `telegramToken`, `telegramIntegrationStatus`, `processTelegramUpdate`, `handleTelegramWebhook`, `activateTelegramWebhook`.

</details>

<details>
<summary>src/teleological_memory.js</summary>

[Otvoriť zdroj](../src/teleological_memory.js)

Exportované rozhrania: `TeleologicalMemoryEngine`.

</details>

<details>
<summary>src/tools.js</summary>

[Otvoriť zdroj](../src/tools.js)

Exportované rozhrania: `INTERNAL_TOOLS`, `DEVELOPMENT_TOOLS`, `PC_TOOLS`, `OWNER_BUSINESS_TOOLS`, `TOOL_SCHEMAS`, `waitForSystemAction`, `searchMemory`, `runTool`, `recallMemory`, `TOOL_HELP`.

</details>

<details>
<summary>src/trading.js</summary>

[Otvoriť zdroj](../src/trading.js)

Exportované rozhrania: `portfolioSchema`, `tradeSchema`, `quoteSchema`, `TRADING_DIRECTIVE`, `createPortfolio`, `listPortfolios`, `computePortfolioSummary`, `getPortfolio`, `recordTrade`, `setQuote`.

</details>

<details>
<summary>src/trinity-documents.js</summary>

[Otvoriť zdroj](../src/trinity-documents.js)

Exportované rozhrania: `DOCUMENT_CATEGORIES`, `createDocumentSchema`, `formatStepMarkdown`, `createTrinityDocument`, `recordStepDocument`, `listTrinityDocuments`, `getTrinityDocument`, `deleteTrinityDocument`, `exportTrinityDocument`.

</details>

<details>
<summary>src/trinity2.js</summary>

[Otvoriť zdroj](../src/trinity2.js)

Exportované rozhrania: `TRINITY2_CAPABILITIES`, `rolePermissions`, `requireCapability`, `updateRolePermission`, `analyzeImage`, `transcribeAudio`, `synthesizeSpeech`, `listVisualWorkflows`, `saveVisualWorkflow`, `listIncidents`, `resolveIncident`, `recordHealthIncident`, `exportAudit`.

</details>

<details>
<summary>src/truth.js</summary>

[Otvoriť zdroj](../src/truth.js)

Exportované rozhrania: `TRUTH_POLICY_VERSION`, `TRUTH_POLICY`, `SIMULATION_MARKER_KEYS`, `findSimulationMarkers`, `assertNoSimulatedData`, `READ_TOOLS`, `findUnsupportedActionClaims`, `truthStatus`, `safeTruthResponse`.

</details>

<details>
<summary>src/ui-evolution.js</summary>

[Otvoriť zdroj](../src/ui-evolution.js)

Exportované rozhrania: `UI_PRESETS`, `uiWidgetSchema`, `uiEvolutionInputSchema`, `sanitizeCustomCss`, `buildGeneratedCss`, `getUiEvolutionState`, `applyUiEvolution`, `handleUiChangeAction`, `renderDynamicThemeCss`.

</details>

<details>
<summary>src/universal-ecosystem.js</summary>

[Otvoriť zdroj](../src/universal-ecosystem.js)

Exportované rozhrania: `UNIVERSAL_DOMAINS`, `APPLICATION_TEMPLATES`, `universalEcosystem`, `synthesizeSkill`, `synthesizePlugin`, `synthesizeApp`, `searchCatalog`.

</details>

<details>
<summary>src/v4/EvoEngineV3.js</summary>

[Otvoriť zdroj](../src/v4/EvoEngineV3.js)

Exportované rozhrania: `EvoEngineV3`.

</details>

<details>
<summary>src/v4/HybridBrain.js</summary>

[Otvoriť zdroj](../src/v4/HybridBrain.js)

Exportované rozhrania: `HybridBrain`.

</details>

<details>
<summary>src/v4/MetaBrain.js</summary>

[Otvoriť zdroj](../src/v4/MetaBrain.js)

Exportované rozhrania: `MetaBrain`.

</details>

<details>
<summary>src/v4/QuantumCoreEngine.js</summary>

[Otvoriť zdroj](../src/v4/QuantumCoreEngine.js)

Exportované rozhrania: `QuantumCoreEngine`.

</details>

<details>
<summary>src/v4/SkillForge.js</summary>

[Otvoriť zdroj](../src/v4/SkillForge.js)

Exportované rozhrania: `SkillForge`.

</details>

<details>
<summary>src/v4/TrinityBrainV4.js</summary>

[Otvoriť zdroj](../src/v4/TrinityBrainV4.js)

Exportované rozhrania: `TrinityBrainV4`.

</details>

<details>
<summary>src/version.js</summary>

[Otvoriť zdroj](../src/version.js)

Exportované rozhrania: `TRINITY_VERSION`, `TRINITY_SOURCE`, `sourceMetadata`, `releaseMetadata`.

</details>

<details>
<summary>src/voice-agent.js</summary>

[Otvoriť zdroj](../src/voice-agent.js)

Exportované rozhrania: `handleVoiceDialogue`.

</details>

<details>
<summary>src/wallet-terminals.js</summary>

[Otvoriť zdroj](../src/wallet-terminals.js)

Exportované rozhrania: `terminalConfigSchema`, `terminalChargeSchema`, `terminalPayoutSchema`, `terminalVerifySchema`, `terminalConfirmSchema`, `normalizeIban`, `normalizeBic`, `toChecksumAddress`, `normalizeEvmAddress`, `generateQrSvg`, `buildEpcPayload`, `getEurUsdRate`, `CRYPTO_CHAINS`, `getWalletTerminalOverview`, `saveWalletTerminalConfig`, `createPaymentTerminalCharge`, `verifyTerminalCharge`, `confirmTerminalEntry`, `executeWalletPayout`, `prepareWalletPayout`, `cancelWalletPayout`, `generateEvmKeypair`, `createCryptoWallet`.

</details>

<details>
<summary>src/wallet.js</summary>

[Otvoriť zdroj](../src/wallet.js)

Exportované rozhrania: `walletTransactionSchema`, `getWallet`, `transactWallet`.

</details>

<details>
<summary>src/web-access.js</summary>

[Otvoriť zdroj](../src/web-access.js)

Exportované rozhrania: `publicWebUrl`, `fetchPublicWeb`.

</details>

<details>
<summary>src/webauthn.js</summary>

[Otvoriť zdroj](../src/webauthn.js)

Exportované rozhrania: `base64UrlEncode`, `base64UrlDecode`, `randomChallenge`, `getRelyingPartyId`, `generateRegistrationOptions`, `verifyRegistrationResponse`, `generateAuthenticationOptions`, `verifyAuthenticationResponse`, `listUserPasskeys`, `deleteUserPasskey`.

</details>

<details>
<summary>src/workflow.js</summary>

[Otvoriť zdroj](../src/workflow.js)

Exportované rozhrania: `TrinityOperations`.

</details>

## services: každý zdrojový modul

<details>
<summary>services/aura-entry.js</summary>

[Otvoriť zdroj](../services/aura-entry.js)

Exportované rozhrania: modul bez priamo deklarovaného pomenovaného exportu; pozri zdroj a reexporty.

</details>

<details>
<summary>services/builder.js</summary>

[Otvoriť zdroj](../services/builder.js)

Exportované rozhrania: modul bez priamo deklarovaného pomenovaného exportu; pozri zdroj a reexporty.

</details>

<details>
<summary>services/chat-inference.js</summary>

[Otvoriť zdroj](../services/chat-inference.js)

Exportované rozhrania: modul bez priamo deklarovaného pomenovaného exportu; pozri zdroj a reexporty.

</details>

<details>
<summary>services/connectors.js</summary>

[Otvoriť zdroj](../services/connectors.js)

Exportované rozhrania: modul bez priamo deklarovaného pomenovaného exportu; pozri zdroj a reexporty.

</details>

<details>
<summary>services/core.js</summary>

[Otvoriť zdroj](../services/core.js)

Exportované rozhrania: modul bez priamo deklarovaného pomenovaného exportu; pozri zdroj a reexporty.

</details>

<details>
<summary>services/dispatcher.js</summary>

[Otvoriť zdroj](../services/dispatcher.js)

Exportované rozhrania: modul bez priamo deklarovaného pomenovaného exportu; pozri zdroj a reexporty.

</details>

<details>
<summary>services/guardian.js</summary>

[Otvoriť zdroj](../services/guardian.js)

Exportované rozhrania: modul bez priamo deklarovaného pomenovaného exportu; pozri zdroj a reexporty.

</details>

<details>
<summary>services/integration-providers.js</summary>

[Otvoriť zdroj](../services/integration-providers.js)

Exportované rozhrania: `IntegrationError`, `allowedSource`, `scrape`, `publishFirebase`.

</details>

<details>
<summary>services/integrations-entry.js</summary>

[Otvoriť zdroj](../services/integrations-entry.js)

Exportované rozhrania: modul bez priamo deklarovaného pomenovaného exportu; pozri zdroj a reexporty.

</details>

<details>
<summary>services/knowledge-api.js</summary>

[Otvoriť zdroj](../services/knowledge-api.js)

Exportované rozhrania: `syncMemory`, `handleKnowledge`.

</details>

<details>
<summary>services/knowledge-entry.js</summary>

[Otvoriť zdroj](../services/knowledge-entry.js)

Exportované rozhrania: modul bez priamo deklarovaného pomenovaného exportu; pozri zdroj a reexporty.

</details>

<details>
<summary>services/legacy-workers/aura_analyzer.js</summary>

[Otvoriť zdroj](../services/legacy-workers/aura_analyzer.js)

Exportované rozhrania: modul bez priamo deklarovaného pomenovaného exportu; pozri zdroj a reexporty.

</details>

<details>
<summary>services/legacy-workers/aura_architect.js</summary>

[Otvoriť zdroj](../services/legacy-workers/aura_architect.js)

Exportované rozhrania: modul bez priamo deklarovaného pomenovaného exportu; pozri zdroj a reexporty.

</details>

<details>
<summary>services/legacy-workers/aura_codegen.js</summary>

[Otvoriť zdroj](../services/legacy-workers/aura_codegen.js)

Exportované rozhrania: modul bez priamo deklarovaného pomenovaného exportu; pozri zdroj a reexporty.

</details>

<details>
<summary>services/legacy-workers/aura_deployer.js</summary>

[Otvoriť zdroj](../services/legacy-workers/aura_deployer.js)

Exportované rozhrania: modul bez priamo deklarovaného pomenovaného exportu; pozri zdroj a reexporty.

</details>

<details>
<summary>services/legacy-workers/aura_evolver.js</summary>

[Otvoriť zdroj](../services/legacy-workers/aura_evolver.js)

Exportované rozhrania: modul bez priamo deklarovaného pomenovaného exportu; pozri zdroj a reexporty.

</details>

<details>
<summary>services/legacy-workers/aura_helpers.js</summary>

[Otvoriť zdroj](../services/legacy-workers/aura_helpers.js)

Exportované rozhrania: `getAiModel`, `runAuraAi`, `parseAuraJson`, `safeDbRun`.

</details>

<details>
<summary>services/legacy-workers/aura_memory.js</summary>

[Otvoriť zdroj](../services/legacy-workers/aura_memory.js)

Exportované rozhrania: modul bez priamo deklarovaného pomenovaného exportu; pozri zdroj a reexporty.

</details>

<details>
<summary>services/legacy-workers/aura_optimizer.js</summary>

[Otvoriť zdroj](../services/legacy-workers/aura_optimizer.js)

Exportované rozhrania: modul bez priamo deklarovaného pomenovaného exportu; pozri zdroj a reexporty.

</details>

<details>
<summary>services/legacy-workers/aura_planner.js</summary>

[Otvoriť zdroj](../services/legacy-workers/aura_planner.js)

Exportované rozhrania: modul bez priamo deklarovaného pomenovaného exportu; pozri zdroj a reexporty.

</details>

<details>
<summary>services/legacy-workers/aura_sentinel.js</summary>

[Otvoriť zdroj](../services/legacy-workers/aura_sentinel.js)

Exportované rozhrania: modul bez priamo deklarovaného pomenovaného exportu; pozri zdroj a reexporty.

</details>

<details>
<summary>services/legacy-workers/aura_tester.js</summary>

[Otvoriť zdroj](../services/legacy-workers/aura_tester.js)

Exportované rozhrania: modul bez priamo deklarovaného pomenovaného exportu; pozri zdroj a reexporty.

</details>

<details>
<summary>services/memory.js</summary>

[Otvoriť zdroj](../services/memory.js)

Exportované rozhrania: modul bez priamo deklarovaného pomenovaného exportu; pozri zdroj a reexporty.

</details>

<details>
<summary>services/ops-proxy.js</summary>

[Otvoriť zdroj](../services/ops-proxy.js)

Exportované rozhrania: modul bez priamo deklarovaného pomenovaného exportu; pozri zdroj a reexporty.

</details>

<details>
<summary>services/sentinel.js</summary>

[Otvoriť zdroj](../services/sentinel.js)

Exportované rozhrania: modul bez priamo deklarovaného pomenovaného exportu; pozri zdroj a reexporty.

</details>

<details>
<summary>services/skills.js</summary>

[Otvoriť zdroj](../services/skills.js)

Exportované rozhrania: modul bez priamo deklarovaného pomenovaného exportu; pozri zdroj a reexporty.

</details>

<details>
<summary>services/worker-runtime.js</summary>

[Otvoriť zdroj](../services/worker-runtime.js)

Exportované rozhrania: `json`, `readCall`, `boundedString`, `boundedLimit`, `requireApproval`, `idempotent`, `safeFailure`, `assertPublicHttps`.

</details>

## Databázové migrácie

Zoznam súborov nepotvrdzuje ich aplikovanie na produkčnú databázu.

- [0001_ops.sql](../migrations/0001_ops.sql)
- [0002_registry.sql](../migrations/0002_registry.sql)
- [0003_memory_login.sql](../migrations/0003_memory_login.sql)
- [0004_plugins.sql](../migrations/0004_plugins.sql)
- [0005_language.sql](../migrations/0005_language.sql)
- [0006_legacy_memories.sql](../migrations/0006_legacy_memories.sql)
- [0007_truth_personality.sql](../migrations/0007_truth_personality.sql)
- [0008_plugin_installations.sql](../migrations/0008_plugin_installations.sql)
- [0009_system_actions.sql](../migrations/0009_system_actions.sql)
- [0010_studio_projects.sql](../migrations/0010_studio_projects.sql)
- [0011_cognition_media.sql](../migrations/0011_cognition_media.sql)
- [0011_skills_connectors.sql](../migrations/0011_skills_connectors.sql)
- [0013_google_auth.sql](../migrations/0013_google_auth.sql)
- [0014_nextgen_core.sql](../migrations/0014_nextgen_core.sql)
- [0015_owner_identity.sql](../migrations/0015_owner_identity.sql)
- [0016_emergency_stop.sql](../migrations/0016_emergency_stop.sql)
- [0017_api_builder.sql](../migrations/0017_api_builder.sql)
- [0018_trading_lab.sql](../migrations/0018_trading_lab.sql)
- [0019_trading_plugin.sql](../migrations/0019_trading_plugin.sql)
- [0020_api_access_keys.sql](../migrations/0020_api_access_keys.sql)
- [0021_secret_vault.sql](../migrations/0021_secret_vault.sql)
- [0022_wallet_sandbox.sql](../migrations/0022_wallet_sandbox.sql)
- [0023_ai_providers.sql](../migrations/0023_ai_providers.sql)
- [0023_personality_continuity.sql](../migrations/0023_personality_continuity.sql)
- [0024_trusted_productivity_plugins.sql](../migrations/0024_trusted_productivity_plugins.sql)
- [0025_gemini_project_control.sql](../migrations/0025_gemini_project_control.sql)
- [0026_operator_plugins.sql](../migrations/0026_operator_plugins.sql)
- [0027_practical_skills.sql](../migrations/0027_practical_skills.sql)
- [0028_extend_system_actions.sql](../migrations/0028_extend_system_actions.sql)
- [0029_assistant_foundations.sql](../migrations/0029_assistant_foundations.sql)
- [0030_full_trinity_catalog.sql](../migrations/0030_full_trinity_catalog.sql)
- [0031_legacy_memory_long.sql](../migrations/0031_legacy_memory_long.sql)
- [0032_ci_audit.sql](../migrations/0032_ci_audit.sql)
- [0033_audit_time_index.sql](../migrations/0033_audit_time_index.sql)
- [0033_copilot_audit.sql](../migrations/0033_copilot_audit.sql)
- [0034_trinity_2.sql](../migrations/0034_trinity_2.sql)
- [0035_ci_audit_namespace.sql](../migrations/0035_ci_audit_namespace.sql)
- [0036_project_baseline.sql](../migrations/0036_project_baseline.sql)
- [0037_domain_engine.sql](../migrations/0037_domain_engine.sql)
- [0037_self_improvement.sql](../migrations/0037_self_improvement.sql)
- [0038_learned_commands.sql](../migrations/0038_learned_commands.sql)
- [0039_self_improvement_behavior_rule.sql](../migrations/0039_self_improvement_behavior_rule.sql)
- [0040_artifacts_storage.sql](../migrations/0040_artifacts_storage.sql)
- [0041_shared_local_notes.sql](../migrations/0041_shared_local_notes.sql)
- [0042_graph_rag_and_studio_reviews.sql](../migrations/0042_graph_rag_and_studio_reviews.sql)
- [0043_domain_escrow_and_monitoring.sql](../migrations/0043_domain_escrow_and_monitoring.sql)
- [0044_price_alerts_and_invoices.sql](../migrations/0044_price_alerts_and_invoices.sql)
- [0045_webauthn_and_audit.sql](../migrations/0045_webauthn_and_audit.sql)
- [0046_login_ticket_identity.sql](../migrations/0046_login_ticket_identity.sql)
- [0047_vault_providers_expansion.sql](../migrations/0047_vault_providers_expansion.sql)

## Doslovné cesty hlavného routera

Statický výber z `src/index.js`; dynamické regex cesty a vnorené routery sú popísané v príslušných zdrojoch. Prítomnosť cesty nepotvrdzuje oprávnenie ani funkčnú integráciu.

- `/api/assistant/ai-providers`
- `/api/assistant/api-keys`
- `/api/assistant/apis`
- `/api/assistant/artifacts`
- `/api/assistant/audit/events`
- `/api/assistant/audit/export`
- `/api/assistant/audit/log`
- `/api/assistant/brain/run`
- `/api/assistant/capabilities`
- `/api/assistant/changes`
- `/api/assistant/chat`
- `/api/assistant/commerce/accounts`
- `/api/assistant/commerce/products`
- `/api/assistant/commerce/status`
- `/api/assistant/commodities/alerts`
- `/api/assistant/commodities/alerts/check`
- `/api/assistant/commodities/analyze`
- `/api/assistant/commodities/auto-invest`
- `/api/assistant/commodities/banks`
- `/api/assistant/commodities/chart`
- `/api/assistant/commodities/overview`
- `/api/assistant/commodities/sync-live`
- `/api/assistant/commodities/trade`
- `/api/assistant/dashboard`
- `/api/assistant/devhub/execute`
- `/api/assistant/devhub/status`
- `/api/assistant/documents`
- `/api/assistant/domains`
- `/api/assistant/domains/check`
- `/api/assistant/domains/environments`
- `/api/assistant/domains/environments/clone`
- `/api/assistant/domains/environments/deploy`
- `/api/assistant/domains/environments/provision`
- `/api/assistant/domains/escrow/settle`
- `/api/assistant/domains/marketplace`
- `/api/assistant/domains/monitoring/alerts`
- `/api/assistant/domains/monitoring/check`
- `/api/assistant/domains/monitoring/telegram`
- `/api/assistant/domains/monitoring/telegram/test`
- `/api/assistant/domains/register`
- `/api/assistant/domains/registration-status`
- `/api/assistant/domains/search`
- `/api/assistant/domains/seed-20`
- `/api/assistant/domains/subdomain`
- `/api/assistant/domains/sync`
- `/api/assistant/evolution/run`
- `/api/assistant/history`
- `/api/assistant/hosting`
- `/api/assistant/incidents`
- `/api/assistant/infrastructure`
- `/api/assistant/integrations/cloudflare`
- `/api/assistant/integrations/firebase`
- `/api/assistant/integrations/firecrawl`
- `/api/assistant/integrations/github`
- `/api/assistant/integrations/status`
- `/api/assistant/media/analyze-image`
- `/api/assistant/media/speech`
- `/api/assistant/media/status`
- `/api/assistant/media/transcribe`
- `/api/assistant/memory`
- `/api/assistant/memory/graph`
- `/api/assistant/memory/graph/sync`
- `/api/assistant/morpheus/status`
- `/api/assistant/multimedia`
- `/api/assistant/multimedia/creative-pack`
- `/api/assistant/multimedia/music`
- `/api/assistant/multimedia/photo`
- `/api/assistant/multimedia/presentation`
- `/api/assistant/multimedia/video`
- `/api/assistant/paypal/order/capture`
- `/api/assistant/paypal/order/create`
- `/api/assistant/paypal/products`
- `/api/assistant/paypal/rest-status`
- `/api/assistant/paypal/status`
- `/api/assistant/project/inspect`
- `/api/assistant/project/source`
- `/api/assistant/projects`
- `/api/assistant/rbac`
- `/api/assistant/revolut/pro/products`
- `/api/assistant/revolut/status`
- `/api/assistant/sandbox/agents`
- `/api/assistant/sandbox/agents/run`
- `/api/assistant/sandbox/domain/provision`
- `/api/assistant/secrets`
- `/api/assistant/self-improvement`
- `/api/assistant/sessions`
- `/api/assistant/settings`
- `/api/assistant/status`
- `/api/assistant/studio/audit`
- `/api/assistant/studio/projects`
- `/api/assistant/trading/portfolios`
- `/api/assistant/trading/quotes`
- `/api/assistant/ui-evolution`
- `/api/assistant/voice/dialogue`
- `/api/assistant/wallet`
- `/api/assistant/wallet/invoices`
- `/api/assistant/wallet/net-worth`
- `/api/assistant/wallet/terminal/charge`
- `/api/assistant/wallet/terminal/config`
- `/api/assistant/wallet/terminal/create-crypto`
- `/api/assistant/wallet/terminal/payout`
- `/api/assistant/workflows`
- `/api/auth/config`
- `/api/auth/google/callback`
- `/api/auth/google/login`
- `/api/auth/google/start`
- `/api/auth/passkey/auth-options`
- `/api/auth/passkey/auth-verify`
- `/api/auth/passkey/list`
- `/api/auth/passkey/register-options`
- `/api/auth/passkey/register-verify`
- `/api/copilot/chat`
- `/api/copilot/plugins`
- `/api/copilot/skills`
- `/api/domains/escrow/inquire`
- `/api/ecosystem/catalog`
- `/api/ecosystem/domains`
- `/api/ecosystem/search`
- `/api/ecosystem/stats`
- `/api/ecosystem/synthesize/app`
- `/api/ecosystem/synthesize/plugin`
- `/api/ecosystem/synthesize/skill`
- `/api/health`
- `/api/modules/catalog`
- `/api/modules/crypto`
- `/api/modules/dns`
- `/api/modules/macro`
- `/api/modules/tech-news`
- `/api/modules/weather`
- `/api/modules/wikipedia`
- `/api/ops/agents`
- `/api/ops/catalog`
- `/api/ops/control`
- `/api/ops/dev-login`
- `/api/ops/events`
- `/api/ops/jobs`
- `/api/ops/login`
- `/api/ops/login-ticket`
- `/api/ops/logout`
- `/api/ops/memory`
- `/api/ops/plugins`
- `/api/ops/plugins/install-all`
- `/api/ops/providers/test`
- `/api/ops/redeem`
- `/api/ops/self-improvement`
- `/api/ops/services`
- `/api/ops/status`
- `/api/ops/users`
- `/api/ops/users/pending`
- `/api/os/processes`
- `/api/os/status`
- `/api/system/actions`
- `/api/system/actions/claim`
- `/api/system/capabilities`
- `/api/system/pc-bridge/v1/heartbeat`
- `/api/telegram/setup`
- `/api/telegram/webhook`
- `/app.js`
- `/auth-bootstrap.js`
- `/auth/google/callback`
- `/auth/google/login`
- `/auth/google/start`
- `/builder.css`
- `/chat.css`
- `/chat.js`
- `/garage-v1.webp`
- `/garage.css`
- `/health`
- `/mcp`
- `/ops`
- `/ready`
- `/style.css`
- `/theme.css`
