from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import requests
from requests.auth import HTTPBasicAuth

from app.core.config import get_settings


@dataclass
class BelvoService:
    timeout: int = 30

    def __post_init__(self) -> None:
        self.settings = get_settings()
        self.base_url = str(self.settings.belvo_base_url).rstrip("/")
        self.auth = HTTPBasicAuth(self.settings.belvo_secret_id, self.settings.belvo_secret_password)
        self.link_ids = [link.strip() for link in self.settings.belvo_link_ids.split(",") if link.strip()]

    def _request(self, method: str, path: str, *, params: Optional[Dict[str, Any]] = None) -> Any:
        url = f"{self.base_url}/api{path}"
        response = requests.request(method, url, auth=self.auth, params=params, timeout=self.timeout)
        response.raise_for_status()
        return response.json()

    def list_institutions(self) -> List[Dict[str, Any]]:
        data = self._request("GET", "/institutions/")
        return data.get('results', []) if isinstance(data, dict) else []

    def list_accounts(self, institution: Optional[str] = None) -> List[Dict[str, Any]]:
        accounts: List[Dict[str, Any]] = []
        for link_id in self.link_ids:
            params = {"link": link_id}
            response = self._request("GET", "/accounts/", params=params)
            if isinstance(response, dict) and "results" in response:
                accounts.extend(response["results"])
            elif isinstance(response, list):
                accounts.extend(response)
        if institution:
            accounts = [item for item in accounts if item.get("institution") == institution]
        return accounts

    def list_transactions(self, account_id: str, *, limit: int = 50) -> List[Dict[str, Any]]:
        params = {"account": account_id, "limit": limit}
        response = self._request("GET", "/transactions/", params=params)
        if isinstance(response, dict) and "results" in response:
            return response["results"]
        if isinstance(response, list):
            return response
        return []

    def retrieve_account(self, account_id: str) -> Optional[Dict[str, Any]]:
        try:
            response = self._request("GET", f"/accounts/{account_id}/")
        except requests.HTTPError:
            return None
        return response if isinstance(response, dict) else None
