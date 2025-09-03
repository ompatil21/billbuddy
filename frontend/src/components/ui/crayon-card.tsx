"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
    title?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    titleClassName?: string;
    headerClassName?: string;
    contentClassName?: string;
};

export function CrayonCard({
    title,
    children,
    className,
    titleClassName,
    headerClassName,
    contentClassName,
}: Props) {
    return (
        <Card className={cn("crayon-card transition-transform hover:-translate-y-0.5", className)}>
            {title !== undefined && (
                <CardHeader className={cn("pb-3", headerClassName)}>
                    <CardTitle className={cn("scribble text-base md:text-lg", titleClassName)}>
                        {title}
                    </CardTitle>
                </CardHeader>
            )}
            <CardContent className={cn("pt-0", contentClassName)}>{children}</CardContent>
        </Card>
    );
}
