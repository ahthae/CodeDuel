export default function Pre({title, children}) {
    return (
<div>
    <p className="opacity-60 mb-1 text-xs">{title}</p>
    <pre className="bg-slate-800 p-2 rounded text-xs whitespace-pre-wrap">
        {children}
    </pre>
</div>
    );
}