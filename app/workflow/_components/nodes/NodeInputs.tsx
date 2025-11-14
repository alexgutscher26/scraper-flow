import React from 'react';
interface Props {
  children: React.ReactNode;
}

function NodeInputs(props: Props) {
  const { children } = props;
  return <div className="flex flex-col gap-2 divide-y">{children}</div>;
}

export default NodeInputs;
