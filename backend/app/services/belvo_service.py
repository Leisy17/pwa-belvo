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

    def _request(
        self,
        method: str,
        path: str,
        *,
        params: Optional[Dict[str, Any]] = None,
        json: Optional[Dict[str, Any]] = None,
    ) -> Any:
        url = f"{self.base_url}/api{path}"
        response = requests.request(
            method,
            url,
            auth=self.auth,
            params=params,
            json=json,
            timeout=self.timeout,
        )
        response.raise_for_status()
        return response.json()

    def list_institutions(self) -> List[Dict[str, Any]]:
        data = self._request("GET", "/institutions/")
        return data.get('results', []) if isinstance(data, dict) else []

    def create_link(
        self,
        *,
        institution_id: str,
        institution_name: Optional[str] = None,
        username: str,
        password: str,
        token: Optional[str] = None,
        access_mode: str = "single",
        external_id: Optional[str] = None,
    ) -> Dict[str, Any]:

        payload: Dict[str, Any] = {
            "institution": institution_name,
            "username": username,
            "password": password,
            "access_mode": access_mode,
        }
        if token:
            payload["token"] = token
        if external_id:
            payload["external_id"] = external_id
        response = self._request("POST", "/links/", json=payload)
        if not isinstance(response, dict):
            raise ValueError("Unexpected response when creating Belvo link.")
        return response

    def list_accounts(self, *, link_id: str) -> List[Dict[str, Any]]:
        params = {"link": link_id}
        response = self._request("GET", "/accounts/", params=params)
        if isinstance(response, dict) and "results" in response:
            return response["results"]
        if isinstance(response, list):
            return response
        return []

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
