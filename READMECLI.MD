# Insighta CLI

## Overview

A command-line interface for interacting with Insighta Labs+ backend.

## Installation

```
npm install -g
```

## Commands

### Authentication

```
insighta login
insighta logout
insighta whoami
```

### Profiles

```
insighta profiles list
insighta profiles get <id>
insighta profiles search "query"
insighta profiles create --name "Name"
insighta profiles export --format csv
```

## Token Handling

* Access token auto-refresh
* Credentials stored at:

```
~/.insighta/credentials.json
```

## API Connection

Set backend URL:

```
INSIGHTA_API_URL=https://stage3-backendnew.onrender.com/
```
