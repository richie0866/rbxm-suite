function unsupported(name: string): () => never {
	return () => error(`'${name}' is not supported by this exploit`, 2);
}

export const requestAsync = request ?? (syn && syn.request) ?? (http && http.request) ?? unsupported("request");

export const getCustomAsset = getcustomasset ?? getsynasset ?? unsupported("getcustomasset");
